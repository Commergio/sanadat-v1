import { NextResponse } from "next/server";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";
import { buildCustomerVerificationPublicApp } from "@/application/customers/factory";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "Verification service not configured" } },
        { status: 503 }
      );
    }

    const { token } = await params;
    const form = await request.formData();
    const signature = form.get("signature");

    if (!(signature instanceof File) || signature.size === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Signature image is required" } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await signature.arrayBuffer());
    const contentType = signature.type || "image/png";
    const userAgent = request.headers.get("user-agent");
    const ip = clientIp(request);

    const app = buildCustomerVerificationPublicApp();
    const { customerId } = await app.approveCustomerVerification(token, buffer, contentType, {
      ip,
      userAgent,
    });

    try {
      const supabase = createServiceRoleClient();
      const { data: customer } = await supabase
        .from("customers")
        .select("company_id, created_by")
        .eq("id", customerId)
        .maybeSingle();

      if (customer?.company_id) {
        let actorId = customer.created_by as string | null;
        if (!actorId) {
          const { data: company } = await supabase
            .from("companies")
            .select("owner_id")
            .eq("id", customer.company_id)
            .maybeSingle();
          actorId = (company?.owner_id as string | null) ?? null;
        }

        if (actorId) {
          const activityLog = new ActivityLogRepository(supabase);
          await activityLog.log(
            {
              userId: actorId,
              companyId: String(customer.company_id),
              role: "accountant",
            },
            "customer.verified",
            customerId,
            { entityType: "customer", actor: "customer" }
          );
        }
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, customer_id: customerId });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to complete verification" } },
      { status: 500 }
    );
  }
}
