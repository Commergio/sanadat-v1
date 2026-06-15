import { NextResponse } from "next/server";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";

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
    const body = (await request.json()) as { reason?: string };
    const reason = body.reason?.trim() ?? "";
    const userAgent = request.headers.get("user-agent");
    const ip = clientIp(request);

    const app = buildReceiptApprovalPublicApp();
    const result = await app.rejectReceiptByToken(token, reason, { ip, userAgent });

    try {
      const supabase = createServiceRoleClient();
      const { data: receipt } = await supabase
        .from("receipt_vouchers")
        .select("created_by")
        .eq("id", result.receiptId)
        .maybeSingle();

      let actorId = receipt?.created_by as string | null;
      if (!actorId) {
        const { data: company } = await supabase
          .from("companies")
          .select("owner_id")
          .eq("id", result.companyId)
          .maybeSingle();
        actorId = (company?.owner_id as string | null) ?? null;
      }

      if (actorId) {
        const activityLog = new ActivityLogRepository(supabase);
        await activityLog.log(
          { userId: actorId, companyId: result.companyId, role: "accountant" },
          "document.rejected",
          result.receiptId,
          { documentType: "receipt_voucher", reason, actor: "customer" }
        );
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, receipt_id: result.receiptId });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to reject receipt" } },
      { status: 500 }
    );
  }
}
