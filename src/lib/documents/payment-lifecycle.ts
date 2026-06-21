import type { DocumentLifecycleStatus } from "@/lib/types";

/** Treat missing lifecycle as issued for legacy payment vouchers created before P3.4. */
export function effectivePaymentLifecycle(
  lifecycleStatus?: DocumentLifecycleStatus | null
): DocumentLifecycleStatus {
  return lifecycleStatus ?? "issued";
}

export function isPaymentIssued(lifecycleStatus?: DocumentLifecycleStatus | null): boolean {
  return effectivePaymentLifecycle(lifecycleStatus) === "issued";
}

export function canExportPayment(
  lifecycleStatus?: DocumentLifecycleStatus | null,
  displayNumber?: string | null
): boolean {
  if (!isPaymentIssued(lifecycleStatus)) return false;
  return Boolean(displayNumber?.trim());
}

export function canSendPaymentApprovalWhatsApp(
  lifecycleStatus?: DocumentLifecycleStatus | null
): boolean {
  const lifecycle = effectivePaymentLifecycle(lifecycleStatus);
  return lifecycle === "draft" || lifecycle === "pending_approval";
}

export function paymentDisplayNumber(
  displayNumber: string | null | undefined,
  lifecycleStatus?: DocumentLifecycleStatus | null
): string {
  if (displayNumber?.trim()) return displayNumber;
  const lifecycle = effectivePaymentLifecycle(lifecycleStatus);
  if (lifecycle === "draft") return "—";
  if (lifecycle === "pending_approval") return "—";
  if (lifecycle === "rejected") return "—";
  return "—";
}
