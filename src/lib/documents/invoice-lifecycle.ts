import type { DocumentLifecycleStatus } from "@/lib/types";

/** Treat missing lifecycle as issued for legacy invoices created before P3.5. */
export function effectiveInvoiceLifecycle(
  lifecycleStatus?: DocumentLifecycleStatus | null
): DocumentLifecycleStatus {
  return lifecycleStatus ?? "issued";
}

export function isInvoiceIssued(lifecycleStatus?: DocumentLifecycleStatus | null): boolean {
  return effectiveInvoiceLifecycle(lifecycleStatus) === "issued";
}

export function canExportInvoice(
  lifecycleStatus?: DocumentLifecycleStatus | null,
  displayNumber?: string | null
): boolean {
  if (!isInvoiceIssued(lifecycleStatus)) return false;
  return Boolean(displayNumber?.trim());
}

export function canSendInvoiceApprovalWhatsApp(
  lifecycleStatus?: DocumentLifecycleStatus | null
): boolean {
  const lifecycle = effectiveInvoiceLifecycle(lifecycleStatus);
  return lifecycle === "draft" || lifecycle === "pending_approval";
}

export function invoiceDisplayNumber(
  displayNumber: string | null | undefined,
  lifecycleStatus?: DocumentLifecycleStatus | null
): string {
  if (displayNumber?.trim()) return displayNumber;
  const lifecycle = effectiveInvoiceLifecycle(lifecycleStatus);
  if (lifecycle === "draft") return "—";
  if (lifecycle === "pending_approval") return "—";
  if (lifecycle === "rejected") return "—";
  return "—";
}
