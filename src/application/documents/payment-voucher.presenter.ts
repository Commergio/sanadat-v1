import type { PaymentVoucher as DomainPaymentVoucher } from "@/domain";
import type { DocumentListRow, PaymentVoucher } from "@/lib/types";
import { effectivePaymentLifecycle, paymentDisplayNumber } from "@/lib/documents/payment-lifecycle";

export function toPaymentListRow(payment: DomainPaymentVoucher): DocumentListRow {
  const lifecycle = effectivePaymentLifecycle(payment.lifecycleStatus);
  return {
    id: payment.id,
    display_number: paymentDisplayNumber(payment.displayNumber, lifecycle),
    party_name: payment.partyName,
    amount: payment.amount,
    date: payment.date,
    status: payment.status,
    payment_method: payment.paymentMethod,
  };
}

export function toPaymentDetail(
  payment: DomainPaymentVoucher,
  options?: { customerSignatureUrl?: string | null }
): PaymentVoucher {
  return {
    id: payment.id,
    type: "payment_voucher",
    company_id: payment.companyId,
    number: payment.number || null,
    display_number: payment.displayNumber || null,
    status: payment.status,
    lifecycle_status: payment.lifecycleStatus,
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
    customer_id: payment.customerId ?? undefined,
    approval_sent_at: payment.approvalSentAt ?? undefined,
    approval_expires_at: payment.approvalExpiresAt ?? undefined,
    approved_at: payment.approvedAt ?? undefined,
    approved_by_name: payment.approvedByName ?? undefined,
    approved_by_phone: payment.approvedByPhone ?? undefined,
    customer_signature_url: options?.customerSignatureUrl ?? null,
    rejection_reason: payment.rejectionReason ?? undefined,
    rejected_at: payment.rejectedAt ?? undefined,
    issued_at: payment.issuedAt ?? undefined,
  };
}
