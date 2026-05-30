import { mockDashboardStats } from "@/lib/mock-data";

export interface NextDocumentNumber {
  number: number;
  displayNumber: string;
  displayNumberEn: string;
}

/** Next sequential receipt number for draft UI (demo / pre-save). */
export function getNextReceiptNumber(): NextDocumentNumber {
  const next = mockDashboardStats.totalReceipts + 1;
  return {
    number: next,
    displayNumber: `قبض-${String(next).padStart(3, "0")}`,
    displayNumberEn: `RCP-${String(next).padStart(3, "0")}`,
  };
}

/** Next sequential payment voucher number for draft UI (demo / pre-save). */
export function getNextPaymentNumber(): NextDocumentNumber {
  const next = mockDashboardStats.totalPayments + 1;
  return {
    number: next,
    displayNumber: `صرف-${String(next).padStart(3, "0")}`,
    displayNumberEn: `PAY-${String(next).padStart(3, "0")}`,
  };
}
