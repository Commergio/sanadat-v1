import type { Invoice as DomainInvoice } from "@/domain";
import type { Invoice, InvoiceListRow } from "@/lib/types";
import { effectiveInvoiceLifecycle, invoiceDisplayNumber } from "@/lib/documents/invoice-lifecycle";

export function toInvoiceListRow(invoice: DomainInvoice): InvoiceListRow {
  const lifecycle = effectiveInvoiceLifecycle(invoice.lifecycleStatus);
  return {
    id: invoice.id,
    display_number: invoiceDisplayNumber(invoice.displayNumber, lifecycle),
    party_name: invoice.partyName,
    amount: invoice.amount,
    date: invoice.date,
    status: invoice.status,
    payment_method: invoice.paymentMethod,
    payment_status: invoice.paymentStatus,
  };
}

export function toInvoiceDetail(
  invoice: DomainInvoice,
  options?: { customerSignatureUrl?: string | null }
): Invoice {
  return {
    id: invoice.id,
    type: "invoice",
    company_id: invoice.companyId,
    number: invoice.number || null,
    display_number: invoice.displayNumber || null,
    status: invoice.status,
    lifecycle_status: invoice.lifecycleStatus,
    date: invoice.date,
    amount: invoice.amount,
    description: invoice.description ?? undefined,
    party_name: invoice.partyName,
    payment_method: invoice.paymentMethod,
    transfer_number: invoice.transferNumber ?? undefined,
    bank_name: invoice.bankName ?? undefined,
    transfer_date: invoice.transferDate ?? undefined,
    reference_number: invoice.referenceNumber ?? undefined,
    cancelled_at: invoice.cancelledAt ?? undefined,
    cancel_reason: invoice.cancelReason ?? undefined,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
    customer_id: invoice.customerId ?? undefined,
    approval_sent_at: invoice.approvalSentAt ?? undefined,
    approval_expires_at: invoice.approvalExpiresAt ?? undefined,
    approved_at: invoice.approvedAt ?? undefined,
    approved_by_name: invoice.approvedByName ?? undefined,
    approved_by_phone: invoice.approvedByPhone ?? undefined,
    customer_signature_url: options?.customerSignatureUrl ?? null,
    rejection_reason: invoice.rejectionReason ?? undefined,
    rejected_at: invoice.rejectedAt ?? undefined,
    issued_at: invoice.issuedAt ?? undefined,
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
    })),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
    payment_status: invoice.paymentStatus,
    linked_receipt_id: invoice.linkedReceiptId ?? undefined,
  };
}
