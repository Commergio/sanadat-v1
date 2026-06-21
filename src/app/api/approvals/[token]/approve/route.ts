import { NextResponse } from "next/server";
import { buildReceiptApprovalPublicApp } from "@/application/documents/receipt-voucher.factory";
import { buildPaymentApprovalPublicApp } from "@/application/documents/payment-voucher.factory";
import { buildInvoiceApprovalPublicApp } from "@/application/documents/invoice.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { getClientIp } from "@/lib/http/client-ip";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { resolveApprovalDocumentType } from "@/lib/approvals/resolve-document-type";
import { logApprovalDocumentActivity } from "@/lib/approvals/log-approval-activity";

function mapStatus(code: string): number {
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "EXPIRED") return 410;
  return 500;
}

async function resolveExistingSignaturePath(
  useExisting: boolean,
  customerId: string | null | undefined,
  payloadPath: string | null | undefined
): Promise<string | null> {
  if (!useExisting) return null;

  let existingSignaturePath = payloadPath?.trim() || null;
  if (!existingSignaturePath && customerId) {
    const supabase = createServiceRoleClient();
    const { data: customer } = await supabase
      .from("customers")
      .select("default_signature_path")
      .eq("id", customerId)
      .maybeSingle();
    existingSignaturePath =
      (customer?.default_signature_path as string | null)?.trim() || null;
  }
  return existingSignaturePath;
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
    const ip = getClientIp(request);
    const documentType = await resolveApprovalDocumentType(token);
    const isPayment = documentType === "payment_voucher";
    const isInvoice = documentType === "invoice";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        use_existing_signature?: boolean;
        approved_by_name?: string;
        approved_by_phone?: string;
      };

      if (isInvoice) {
        const app = buildInvoiceApprovalPublicApp();
        const payload = await app.getInvoiceApprovalByToken(token);
        const existingSignaturePath = await resolveExistingSignaturePath(
          Boolean(body.use_existing_signature),
          payload.customerId,
          payload.customerSignaturePath
        );

        const result = await app.approveInvoiceByToken(token, {
          useExistingSignaturePath: body.use_existing_signature ? existingSignaturePath : null,
          approvedByName: body.approved_by_name ?? null,
          approvedByPhone: body.approved_by_phone ?? null,
          ip,
          userAgent,
        });

        await logApprovalDocumentActivity(
          "invoice",
          result.invoiceId,
          result.companyId,
          ["document.approved", "document.issued"],
          { displayNumber: result.displayNumber }
        );

        return NextResponse.json({
          ok: true,
          document_id: result.invoiceId,
          receipt_id: result.invoiceId,
          display_number: result.displayNumber,
        });
      }

      if (isPayment) {
        const app = buildPaymentApprovalPublicApp();
        const payload = await app.getPaymentApprovalByToken(token);
        const existingSignaturePath = await resolveExistingSignaturePath(
          Boolean(body.use_existing_signature),
          payload.customerId,
          payload.customerSignaturePath
        );

        const result = await app.approvePaymentByToken(token, {
          useExistingSignaturePath: body.use_existing_signature ? existingSignaturePath : null,
          approvedByName: body.approved_by_name ?? null,
          approvedByPhone: body.approved_by_phone ?? null,
          ip,
          userAgent,
        });

        await logApprovalDocumentActivity(
          "payment_voucher",
          result.paymentId,
          result.companyId,
          ["document.approved", "document.issued"],
          { displayNumber: result.displayNumber }
        );

        return NextResponse.json({
          ok: true,
          document_id: result.paymentId,
          receipt_id: result.paymentId,
          display_number: result.displayNumber,
        });
      }

      const app = buildReceiptApprovalPublicApp();
      const payload = await app.getReceiptApprovalByToken(token);
      const existingSignaturePath = await resolveExistingSignaturePath(
        Boolean(body.use_existing_signature),
        payload.customerId,
        payload.customerSignaturePath
      );

      const result = await app.approveReceiptByToken(token, {
        useExistingSignaturePath: body.use_existing_signature ? existingSignaturePath : null,
        approvedByName: body.approved_by_name ?? null,
        approvedByPhone: body.approved_by_phone ?? null,
        ip,
        userAgent,
      });

      await logApprovalDocumentActivity(
        "receipt_voucher",
        result.receiptId,
        result.companyId,
        ["document.approved", "document.issued"],
        { displayNumber: result.displayNumber }
      );

      return NextResponse.json({
        ok: true,
        document_id: result.receiptId,
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

    if (isInvoice) {
      const app = buildInvoiceApprovalPublicApp();
      const result = await app.approveInvoiceByToken(token, {
        signatureBuffer: buffer,
        signatureContentType: sigContentType,
        approvedByName: approvedByName || null,
        approvedByPhone: approvedByPhone || null,
        ip,
        userAgent,
      });

      await logApprovalDocumentActivity(
        "invoice",
        result.invoiceId,
        result.companyId,
        ["document.approved", "document.issued"],
        { displayNumber: result.displayNumber }
      );

      return NextResponse.json({
        ok: true,
        document_id: result.invoiceId,
        receipt_id: result.invoiceId,
        display_number: result.displayNumber,
      });
    }

    if (isPayment) {
      const app = buildPaymentApprovalPublicApp();
      const result = await app.approvePaymentByToken(token, {
        signatureBuffer: buffer,
        signatureContentType: sigContentType,
        approvedByName: approvedByName || null,
        approvedByPhone: approvedByPhone || null,
        ip,
        userAgent,
      });

      await logApprovalDocumentActivity(
        "payment_voucher",
        result.paymentId,
        result.companyId,
        ["document.approved", "document.issued"],
        { displayNumber: result.displayNumber }
      );

      return NextResponse.json({
        ok: true,
        document_id: result.paymentId,
        receipt_id: result.paymentId,
        display_number: result.displayNumber,
      });
    }

    const app = buildReceiptApprovalPublicApp();
    const result = await app.approveReceiptByToken(token, {
      signatureBuffer: buffer,
      signatureContentType: sigContentType,
      approvedByName: approvedByName || null,
      approvedByPhone: approvedByPhone || null,
      ip,
      userAgent,
    });

    await logApprovalDocumentActivity(
      "receipt_voucher",
      result.receiptId,
      result.companyId,
      ["document.approved", "document.issued"],
      { displayNumber: result.displayNumber }
    );

    return NextResponse.json({
      ok: true,
      document_id: result.receiptId,
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
      { error: { code: "INTERNAL", message: "Failed to approve document" } },
      { status: 500 }
    );
  }
}
