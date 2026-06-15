import type { DocumentLifecycleStatus } from "@/lib/types";

/** Receipt vouchers are exportable/printable only after customer approval issues the document. */
export function isReceiptIssued(lifecycleStatus?: DocumentLifecycleStatus | null): boolean {
  return lifecycleStatus === "issued";
}

export function canExportReceipt(
  lifecycleStatus?: DocumentLifecycleStatus | null,
  status?: "active" | "cancelled"
): boolean {
  if (status === "cancelled") return false;
  if (!lifecycleStatus) return true;
  return lifecycleStatus === "issued";
}

export function receiptDisplayNumber(
  displayNumber: string | null | undefined,
  lifecycleStatus?: DocumentLifecycleStatus | null
): string {
  if (displayNumber?.trim()) return displayNumber;
  if (lifecycleStatus === "draft") return "—";
  if (lifecycleStatus === "pending_approval") return "—";
  if (lifecycleStatus === "rejected") return "—";
  return "—";
}
