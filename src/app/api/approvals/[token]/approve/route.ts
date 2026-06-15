import { NextResponse } from "next/server";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function mapStatus(code: string): number {
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "EXPIRED") return 410;
  return 500;
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

async function logReceiptActivity(
  receiptId: string,
  companyId: string,
  actions: Array<"document.approved" | "document.issued" | "document.rejected">,
  metadata: Record<string, unknown>
) {
  try {
    const supabase = createServiceRoleClient();
    const { data: receipt } = await supabase
      .from("receipt_vouchers")
      .select("created_by")
      .eq("id", receiptId)
      .maybeSingle();

    let actorId = receipt?.created_by as string | null;
    if (!actorId) {
      const { data: company } = await supabase
        .from("companies")
        .select("owner_id")
        .eq("id", companyId)
        .maybeSingle();
      actorId = (company?.owner_id as string | null) ?? null;
    }

    if (!actorId) return;

    const activityLog = new ActivityLogRepository(supabase);
    const ctx = { userId: actorId, companyId, role: "accountant" as const };
    for (const action of actions) {
      await activityLog.log(ctx, action, receiptId, {
        documentType: "receipt_voucher",
        actor: "customer",
        ...metadata,
      });
    }
  } catch {
    // Non-blocking
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "Approval service not configured" } },
        { status: 503 }
      );
    }

    const { token } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    const userAgent = request.headers.get("user-agent");
    const ip = clientIp(request);

    const app = buildReceiptApprovalPublicApp();

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        use_existing_signature?: boolean;
        approved_by_name?: string;
        approved_by_phone?: string;
      };

      const payload = await app.getReceiptApprovalByToken(token);
      const result = await app.approveReceiptByToken(token, {
        useExistingSignaturePath:
          body.use_existing_signature && payload.customerSignaturePath
            ? payload.customerSignaturePath
            : null,
        approvedByName: body.approved_by_name ?? null,
        approvedByPhone: body.approved_by_phone ?? null,
        ip,
        userAgent,
      });

      await logReceiptActivity(result.receiptId, result.companyId, ["document.approved", "document.issued"], {
        displayNumber: result.displayNumber,
      });

      return NextResponse.json({
        ok: true,
        receipt_id: result.receiptId,
        display_number: result.displayNumber,
      });
    }

    const form = await request.formData();
    const signature = form.get("signature");
    const approvedByName = String(form.get("approved_by_name") ?? "");
    const approvedByPhone = String(form.get("approved_by_phone") ?? "");

    if (!(signature instanceof File) || signature.size === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Signature image is required" } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await signature.arrayBuffer());
    const sigContentType = signature.type || "image/png";

    const result = await app.approveReceiptByToken(token, {
      signatureBuffer: buffer,
      signatureContentType: sigContentType,
      approvedByName: approvedByName || null,
      approvedByPhone: approvedByPhone || null,
      ip,
      userAgent,
    });

    await logReceiptActivity(result.receiptId, result.companyId, ["document.approved", "document.issued"], {
      displayNumber: result.displayNumber,
    });

    return NextResponse.json({
      ok: true,
      receipt_id: result.receiptId,
      display_number: result.displayNumber,
    });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to approve receipt" } },
      { status: 500 }
    );
  }
}
