import { NextResponse } from "next/server";
import { buildCustomerVerificationPublicApp } from "@/application/customers/factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { isServiceRoleConfigured } from "@/lib/env";

function mapStatus(code: string): number {
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "EXPIRED") return 410;
  return 500;
}

export async function GET(
  _request: Request,
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
    const app = buildCustomerVerificationPublicApp();
    const payload = await app.getCustomerVerificationByToken(token);
    const redact = !payload.tokenValid;
    return NextResponse.json({
      customer_id: redact ? "" : payload.customerId,
      company_name: payload.companyName,
      customer_name: redact ? "" : payload.customerName,
      customer_phone: redact ? "" : payload.customerPhone,
      is_verified: payload.isVerified,
      token_valid: payload.tokenValid,
      token_expired: payload.tokenExpired,
      token_used: payload.tokenUsed,
    });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load verification" } },
      { status: 500 }
    );
  }
}
