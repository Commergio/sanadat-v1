import type { DashboardStats, DocumentListRow, InvoiceListRow } from "@/lib/types";

/**
 * Empty dashboard data until P1 wires Supabase document repositories.
 */
export const emptyDashboardStats: DashboardStats = {
  totalReceipts: 0,
  totalPayments: 0,
  totalInvoices: 0,
  subscriptionStatus: "trialing",
  subscriptionExpiresAt: new Date().toISOString(),
  daysUntilExpiry: 14,
  recentDocuments: [],
};

export const emptyReceiptsList: DocumentListRow[] = [];
export const emptyPaymentsList: DocumentListRow[] = [];
export const emptyInvoicesList: InvoiceListRow[] = [];

export function getEmptyChartData(_locale: string) {
  return [
    { month: "1", receipts: 0, payments: 0 },
    { month: "2", receipts: 0, payments: 0 },
    { month: "3", receipts: 0, payments: 0 },
    { month: "4", receipts: 0, payments: 0 },
    { month: "5", receipts: 0, payments: 0 },
    { month: "6", receipts: 0, payments: 0 },
  ];
}
