import { NextResponse } from "next/server";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { buildPaymentApprovalPublicApp } from "@/application/documents/payment-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { resolveApprovalDocumentType } from "@/lib/approvals/resolve-document-type";
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

function serializeSnapshot(snapshot: {
  date: string;
  amount: number;
  partyName: string;
  description: string | null;
  paymentMethod: string;
  transferNumber: string | null;
  bankName: string | null;
  referenceNumber: string | null;
}) {
  return {
    date: snapshot.date,
    amount: snapshot.amount,
    party_name: snapshot.partyName,
    description: snapshot.description,
    payment_method: snapshot.paymentMethod,
    transfer_number: snapshot.transferNumber,
    bank_name: snapshot.bankName,
    reference_number: snapshot.referenceNumber,
  };
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
    const documentType = await resolveApprovalDocumentType(token);

    if (documentType === "payment_voucher") {
      const app = buildPaymentApprovalPublicApp();
      const payload = await app.getPaymentApprovalByToken(token);

      let customerSignatureUrl: string | null = null;
      if (payload.customerSignaturePath) {
        const supabase = createServiceRoleClient();
        customerSignatureUrl = await createCustomerSignatureSignedUrl(
          supabase,
          payload.customerSignaturePath
        );
      }

      return NextResponse.json({
        document_type: "payment_voucher",
        document_id: payload.paymentId,
        receipt_id: payload.paymentId,
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
        snapshot: serializeSnapshot(payload.snapshot),
        token_valid: payload.tokenValid,
        token_expired: payload.tokenExpired,
        token_used: Boolean(payload.tokenUsedAt),
        token_expires_at: payload.tokenExpiresAt,
      });
    }

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
      document_type: "receipt_voucher",
      document_id: payload.receiptId,
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
      snapshot: serializeSnapshot(payload.snapshot),
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
