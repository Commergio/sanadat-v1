import type { Invoice as DomainInvoice } from "@/domain";
import type { Invoice, InvoiceListRow } from "@/lib/types";

export function toInvoiceListRow(invoice: DomainInvoice): InvoiceListRow {
  return {
    id: invoice.id,
    display_number: invoice.displayNumber,
    party_name: invoice.partyName,
    amount: invoice.amount,
    date: invoice.date,
    status: invoice.status,
    payment_method: invoice.paymentMethod,
    payment_status: invoice.paymentStatus,
  };
}

export function toInvoiceDetail(invoice: DomainInvoice): Invoice {
  return {
    id: invoice.id,
    type: "invoice",
    company_id: invoice.companyId,
    number: invoice.number,
    display_number: invoice.displayNumber,
    status: invoice.status,
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
