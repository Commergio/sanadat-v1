import type { ReceiptVoucher as DomainReceiptVoucher } from "@/domain";
import type { DocumentListRow, ReceiptVoucher } from "@/lib/types";

export function toReceiptListRow(receipt: DomainReceiptVoucher): DocumentListRow {
  return {
    id: receipt.id,
    display_number: receipt.displayNumber,
    party_name: receipt.partyName,
    amount: receipt.amount,
    date: receipt.date,
    status: receipt.status,
    payment_method: receipt.paymentMethod,
  };
}

export function toReceiptDetail(receipt: DomainReceiptVoucher): ReceiptVoucher {
  return {
    id: receipt.id,
    type: "receipt_voucher",
    company_id: receipt.companyId,
    number: receipt.number || null,
    display_number: receipt.displayNumber || null,
    status: receipt.status,
    lifecycle_status: receipt.lifecycleStatus,
    date: receipt.date,
    amount: receipt.amount,
    description: receipt.description ?? undefined,
    party_name: receipt.partyName,
    payment_method: receipt.paymentMethod,
    transfer_number: receipt.transferNumber ?? undefined,
    bank_name: receipt.bankName ?? undefined,
    transfer_date: receipt.transferDate ?? undefined,
    reference_number: receipt.referenceNumber ?? undefined,
    cancelled_at: receipt.cancelledAt ?? undefined,
    cancel_reason: receipt.cancelReason ?? undefined,
    created_at: receipt.createdAt,
    updated_at: receipt.updatedAt,
    linked_invoice_id: receipt.linkedInvoiceId ?? undefined,
    customer_id: receipt.customerId ?? undefined,
    approval_sent_at: receipt.approvalSentAt ?? undefined,
    approval_expires_at: receipt.approvalExpiresAt ?? undefined,
    approved_at: receipt.approvedAt ?? undefined,
    approved_by_name: receipt.approvedByName ?? undefined,
    approved_by_phone: receipt.approvedByPhone ?? undefined,
    customer_signature_url: null,
    rejection_reason: receipt.rejectionReason ?? undefined,
    rejected_at: receipt.rejectedAt ?? undefined,
    issued_at: receipt.issuedAt ?? undefined,
  };
}
