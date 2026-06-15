import type { Invoice, InvoiceItem } from "@/domain/documents/invoice/entity";
import type { PaymentVoucher } from "@/domain/documents/payment/entity";
import type { ReceiptVoucher } from "@/domain/documents/receipt/entity";
import type { DocumentLifecycleStatus } from "@/domain/documents/shared/types";

type Row = Record<string, unknown>;

function mapApprovalFields(row: Row) {
  const lifecycleStatus =
    (row.lifecycle_status as DocumentLifecycleStatus | undefined) ?? "issued";

  return {
    lifecycleStatus,
    customerId: (row.customer_id as string | null) ?? null,
    approvalTokenHash: (row.approval_token_hash as string | null) ?? null,
    approvalSentAt: (row.approval_sent_at as string | null) ?? null,
    approvalExpiresAt: (row.approval_expires_at as string | null) ?? null,
    approvalTokenUsedAt: (row.approval_token_used_at as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    approvedByName: (row.approved_by_name as string | null) ?? null,
    approvedByPhone: (row.approved_by_phone as string | null) ?? null,
    customerSignaturePath: (row.customer_signature_path as string | null) ?? null,
    approvalIp: (row.approval_ip as string | null) ?? null,
    approvalUserAgent: (row.approval_user_agent as string | null) ?? null,
    rejectionReason: (row.rejection_reason as string | null) ?? null,
    rejectedAt: (row.rejected_at as string | null) ?? null,
    issuedAt: (row.issued_at as string | null) ?? null,
    issuedBy: (row.issued_by as string | null) ?? null,
    approvalSnapshotVersion: Number(row.approval_snapshot_version ?? 1),
    contentLockedAt: (row.content_locked_at as string | null) ?? null,
  };
}

function mapBase(row: Row) {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    number: row.number != null ? Number(row.number) : 0,
    displayNumber: row.display_number != null ? String(row.display_number) : "",
    status: row.status as "active" | "cancelled",
    date: String(row.date),
    amount: Number(row.amount),
    partyName: String(row.party_name),
    description: (row.description as string | null) ?? null,
    paymentMethod: row.payment_method as "cash" | "bank_transfer" | "pos",
    transferNumber: (row.transfer_number as string | null) ?? null,
    bankName: (row.bank_name as string | null) ?? null,
    transferDate: (row.transfer_date as string | null) ?? null,
    referenceNumber: (row.reference_number as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    cancelReason: (row.cancel_reason as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    ...mapApprovalFields(row),
  };
}

export function mapReceiptVoucher(row: Row): ReceiptVoucher {
  return {
    ...mapBase(row),
    type: "receipt_voucher",
    linkedInvoiceId: (row.linked_invoice_id as string | null) ?? null,
  };
}

export function mapPaymentVoucher(row: Row): PaymentVoucher {
  return {
    ...mapBase(row),
    type: "payment_voucher",
  };
}

export function mapInvoiceItem(row: Row): InvoiceItem {
  return {
    id: String(row.id),
    description: String(row.description),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapInvoice(row: Row, items: InvoiceItem[]): Invoice {
  return {
    ...mapBase(row),
    type: "invoice",
    items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),
    paymentStatus: row.payment_status as "paid" | "unpaid" | "partial",
    linkedReceiptId: (row.linked_receipt_id as string | null) ?? null,
  };
}
