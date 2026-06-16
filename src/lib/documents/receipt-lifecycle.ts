import type { DocumentLifecycleStatus } from "@/lib/types";

/** Treat missing lifecycle as issued for legacy receipts created before P3.3. */
export function effectiveReceiptLifecycle(
  lifecycleStatus?: DocumentLifecycleStatus | null
): DocumentLifecycleStatus {
  return lifecycleStatus ?? "issued";
}

/** Receipt vouchers are exportable/printable only after customer approval issues the document. */
export function isReceiptIssued(lifecycleStatus?: DocumentLifecycleStatus | null): boolean {
  return effectiveReceiptLifecycle(lifecycleStatus) === "issued";
}

export function canExportReceipt(
  lifecycleStatus?: DocumentLifecycleStatus | null,
  displayNumber?: string | null
): boolean {
  if (!isReceiptIssued(lifecycleStatus)) return false;
  return Boolean(displayNumber?.trim());
}

export function canSendReceiptApprovalWhatsApp(
  lifecycleStatus?: DocumentLifecycleStatus | null
): boolean {
  const lifecycle = effectiveReceiptLifecycle(lifecycleStatus);
  return lifecycle === "draft" || lifecycle === "pending_approval";
}

export function receiptDisplayNumber(
  displayNumber: string | null | undefined,
  lifecycleStatus?: DocumentLifecycleStatus | null
): string {
  if (displayNumber?.trim()) return displayNumber;
  const lifecycle = effectiveReceiptLifecycle(lifecycleStatus);
  if (lifecycle === "draft") return "—";
  if (lifecycle === "pending_approval") return "—";
  if (lifecycle === "rejected") return "—";
  return "—";
}
