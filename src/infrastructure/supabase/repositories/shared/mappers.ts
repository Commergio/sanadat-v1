import type { Invoice, InvoiceItem } from "@/domain/documents/invoice/entity";
import type { PaymentVoucher } from "@/domain/documents/payment/entity";
import type { ReceiptVoucher } from "@/domain/documents/receipt/entity";

type Row = Record<string, unknown>;

function mapBase(row: Row) {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    number: Number(row.number),
    displayNumber: String(row.display_number),
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
