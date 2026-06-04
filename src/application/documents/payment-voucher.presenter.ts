import type { PaymentVoucher as DomainPaymentVoucher } from "@/domain";
import type { DocumentListRow, PaymentVoucher } from "@/lib/types";

export function toPaymentListRow(payment: DomainPaymentVoucher): DocumentListRow {
  return {
    id: payment.id,
    display_number: payment.displayNumber,
    party_name: payment.partyName,
    amount: payment.amount,
    date: payment.date,
    status: payment.status,
    payment_method: payment.paymentMethod,
  };
}

export function toPaymentDetail(payment: DomainPaymentVoucher): PaymentVoucher {
  return {
    id: payment.id,
    type: "payment_voucher",
    company_id: payment.companyId,
    number: payment.number,
    display_number: payment.displayNumber,
    status: payment.status,
    date: payment.date,
    amount: payment.amount,
    description: payment.description ?? undefined,
    party_name: payment.partyName,
    payment_method: payment.paymentMethod,
    transfer_number: payment.transferNumber ?? undefined,
    bank_name: payment.bankName ?? undefined,
    transfer_date: payment.transferDate ?? undefined,
    reference_number: payment.referenceNumber ?? undefined,
    cancelled_at: payment.cancelledAt ?? undefined,
    cancel_reason: payment.cancelReason ?? undefined,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
  };
}
