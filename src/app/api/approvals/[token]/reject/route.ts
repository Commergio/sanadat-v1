import { NextResponse } from "next/server";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { buildPaymentApprovalPublicApp } from "@/application/documents/payment-voucher.factory";
import { buildInvoiceApprovalPublicApp } from "@/application/documents/invoice.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { getClientIp } from "@/lib/http/client-ip";
import { isServiceRoleConfigured } from "@/lib/env";
import { resolveApprovalDocumentType } from "@/lib/approvals/resolve-document-type";
import { logApprovalDocumentActivity } from "@/lib/approvals/log-approval-activity";

function mapStatus(code: string): number {
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "EXPIRED") return 410;
  return 500;
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
    const ip = getClientIp(request);
    const documentType = await resolveApprovalDocumentType(token);

    if (documentType === "invoice") {
      const app = buildInvoiceApprovalPublicApp();
      const result = await app.rejectInvoiceByToken(token, reason, { ip, userAgent });

      await logApprovalDocumentActivity(
        "invoice",
        result.invoiceId,
        result.companyId,
        ["document.rejected"],
        { reason }
      );

      return NextResponse.json({ ok: true, document_id: result.invoiceId, receipt_id: result.invoiceId });
    }

    if (documentType === "payment_voucher") {
      const app = buildPaymentApprovalPublicApp();
      const result = await app.rejectPaymentByToken(token, reason, { ip, userAgent });

      await logApprovalDocumentActivity(
        "payment_voucher",
        result.paymentId,
        result.companyId,
        ["document.rejected"],
        { reason }
      );

      return NextResponse.json({ ok: true, document_id: result.paymentId, receipt_id: result.paymentId });
    }

    const app = buildReceiptApprovalPublicApp();
    const result = await app.rejectReceiptByToken(token, reason, { ip, userAgent });

    await logApprovalDocumentActivity(
      "receipt_voucher",
      result.receiptId,
      result.companyId,
      ["document.rejected"],
      { reason }
    );

    return NextResponse.json({ ok: true, document_id: result.receiptId, receipt_id: result.receiptId });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to reject document" } },
      { status: 500 }
    );
  }
}
