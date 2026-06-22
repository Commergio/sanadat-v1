import { NextResponse } from "next/server";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { buildPaymentApprovalPublicApp } from "@/application/documents/payment-voucher.factory";
import { buildInvoiceApprovalPublicApp } from "@/application/documents/invoice.factory";
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

function serializeVoucherSnapshot(snapshot: {
  date: string;
  amount?: number;
  partyName: string;
  description: string | null;
  paymentMethod: string;
  transferNumber: string | null;
  bankName: string | null;
  referenceNumber: string | null;
}) {
  return {
    date: snapshot.date,
    amount: snapshot.amount ?? 0,
    party_name: snapshot.partyName,
    description: snapshot.description,
    payment_method: snapshot.paymentMethod,
    transfer_number: snapshot.transferNumber,
    bank_name: snapshot.bankName,
    reference_number: snapshot.referenceNumber,
  };
}

function serializeInvoiceSnapshot(snapshot: {
  date: string;
  partyName: string;
  description: string | null;
  paymentMethod: string;
  transferNumber: string | null;
  bankName: string | null;
  referenceNumber: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sortOrder: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}) {
  return {
    date: snapshot.date,
    party_name: snapshot.partyName,
    description: snapshot.description,
    payment_method: snapshot.paymentMethod,
    transfer_number: snapshot.transferNumber,
    bank_name: snapshot.bankName,
    reference_number: snapshot.referenceNumber,
    items: snapshot.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      sort_order: item.sortOrder,
    })),
    subtotal: snapshot.subtotal,
    discount: snapshot.discount,
    tax: snapshot.tax,
    total: snapshot.total,
    amount: snapshot.total,
  };
}

function buildCommonResponse(
  documentType: "receipt_voucher" | "payment_voucher" | "invoice",
  documentId: string,
  payload: {
    companyName: string;
    companyNameEn: string | null;
    companyPhone: string | null;
    companyCrNumber: string | null;
    companyVatNumber: string | null;
    companyAddress: string | null;
    customerName: string;
    customerPhone: string;
    customerVerified: boolean;
    lifecycleStatus: string;
    tokenValid: boolean;
    tokenExpired: boolean;
    tokenUsedAt: string | null;
    tokenExpiresAt: string | null;
  },
  snapshot: Record<string, unknown>,
  customerSignatureUrl: string | null
) {
  const redact = !payload.tokenValid;
  return {
    document_type: documentType,
    document_id: documentId,
    receipt_id: documentId,
    company_name: payload.companyName,
    company_name_en: payload.companyNameEn,
    company_phone: redact ? null : payload.companyPhone,
    company_cr_number: redact ? null : payload.companyCrNumber,
    company_vat_number: redact ? null : payload.companyVatNumber,
    company_address: redact ? null : payload.companyAddress,
    customer_name: redact ? "" : payload.customerName,
    customer_phone: redact ? "" : payload.customerPhone,
    customer_verified: payload.customerVerified,
    customer_signature_url: redact ? null : customerSignatureUrl,
    lifecycle_status: payload.lifecycleStatus,
    snapshot: redact ? {} : snapshot,
    token_valid: payload.tokenValid,
    token_expired: payload.tokenExpired,
    token_used: Boolean(payload.tokenUsedAt),
    token_expires_at: payload.tokenExpiresAt,
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

    if (documentType === "invoice") {
      const app = buildInvoiceApprovalPublicApp();
      const payload = await app.getInvoiceApprovalByToken(token);

      let customerSignatureUrl: string | null = null;
      if (payload.customerSignaturePath) {
        const supabase = createServiceRoleClient();
        customerSignatureUrl = await createCustomerSignatureSignedUrl(
          supabase,
          payload.customerSignaturePath
        );
      }

      return NextResponse.json(
        buildCommonResponse(
          "invoice",
          payload.invoiceId,
          payload,
          serializeInvoiceSnapshot(payload.snapshot),
          customerSignatureUrl
        )
      );
    }

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

      return NextResponse.json(
        buildCommonResponse(
          "payment_voucher",
          payload.paymentId,
          payload,
          serializeVoucherSnapshot(payload.snapshot),
          customerSignatureUrl
        )
      );
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

    return NextResponse.json(
      buildCommonResponse(
        "receipt_voucher",
        payload.receiptId,
        payload,
        serializeVoucherSnapshot(payload.snapshot),
        customerSignatureUrl
      )
    );
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
