import { NextResponse } from "next/server";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createCustomerSignatureSignedUrl } from "@/lib/storage/customer-signature";
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
        { error: { code: "NOT_CONFIGURED", message: "Approval service not configured" } },
        { status: 503 }
      );
    }

    const { token } = await params;
    const app = buildReceiptApprovalPublicApp();
    const payload = await app.getReceiptApprovalByToken(token);

    let customerSignatureUrl: string | null = null;
    if (payload.customerSignaturePath) {
      const supabase = createServiceRoleClient();
      customerSignatureUrl = await createCustomerSignatureSignedUrl(
        supabase,
        payload.customerSignaturePath
      );
    }

    return NextResponse.json({
      receipt_id: payload.receiptId,
      company_name: payload.companyName,
      company_name_en: payload.companyNameEn,
      company_phone: payload.companyPhone,
      company_cr_number: payload.companyCrNumber,
      company_vat_number: payload.companyVatNumber,
      company_address: payload.companyAddress,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_verified: payload.customerVerified,
      customer_signature_url: customerSignatureUrl,
      lifecycle_status: payload.lifecycleStatus,
      snapshot: {
        date: payload.snapshot.date,
        amount: payload.snapshot.amount,
        party_name: payload.snapshot.partyName,
        description: payload.snapshot.description,
        payment_method: payload.snapshot.paymentMethod,
        transfer_number: payload.snapshot.transferNumber,
        bank_name: payload.snapshot.bankName,
        reference_number: payload.snapshot.referenceNumber,
      },
      token_valid: payload.tokenValid,
      token_expired: payload.tokenExpired,
      token_used: Boolean(payload.tokenUsedAt),
      token_expires_at: payload.tokenExpiresAt,
    });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load approval" } },
      { status: 500 }
    );
  }
}
