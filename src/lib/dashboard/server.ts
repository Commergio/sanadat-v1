import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardStats, DocumentStatus, DocumentType } from "@/lib/types";
import type { TenantContext } from "@/lib/tenant";
import { daysUntil } from "@/lib/utils";

type RecentRow = {
  id: string;
  display_number: string;
  party_name: string;
  amount: number;
  date: string;
  status: DocumentStatus;
};

type MonthlyPoint = {
  month: string;
  receipts: number;
  payments: number;
  invoices: number;
};

function createMonthBuckets(locale: string): Map<string, MonthlyPoint> {
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const map = new Map<string, MonthlyPoint>();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, {
      month: formatter.format(d),
      receipts: 0,
      payments: 0,
      invoices: 0,
    });
  }
  return map;
}

function monthKeyFromDate(input: string): string {
  const d = new Date(input);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchCountsAndSums(supabase: SupabaseClient, companyId: string) {
  const [receiptsCountRes, paymentsCountRes, invoicesCountRes] = await Promise.all([
    supabase.from("receipt_vouchers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("payment_vouchers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId),
  ]);

  if (receiptsCountRes.error) throw receiptsCountRes.error;
  if (paymentsCountRes.error) throw paymentsCountRes.error;
  if (invoicesCountRes.error) throw invoicesCountRes.error;

  const [activeReceiptsRes, activePaymentsRes, activeInvoicesRes] = await Promise.all([
    supabase.from("receipt_vouchers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
    supabase.from("payment_vouchers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
  ]);
  if (activeReceiptsRes.error) throw activeReceiptsRes.error;
  if (activePaymentsRes.error) throw activePaymentsRes.error;
  if (activeInvoicesRes.error) throw activeInvoicesRes.error;

  const [cancelledReceiptsRes, cancelledPaymentsRes, cancelledInvoicesRes] = await Promise.all([
    supabase.from("receipt_vouchers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "cancelled"),
    supabase.from("payment_vouchers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "cancelled"),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "cancelled"),
  ]);
  if (cancelledReceiptsRes.error) throw cancelledReceiptsRes.error;
  if (cancelledPaymentsRes.error) throw cancelledPaymentsRes.error;
  if (cancelledInvoicesRes.error) throw cancelledInvoicesRes.error;

  const [receiptsSumRes, paymentsSumRes, invoicesSumRes] = await Promise.all([
    supabase.from("receipt_vouchers").select("total:amount.sum()").eq("company_id", companyId).single(),
    supabase.from("payment_vouchers").select("total:amount.sum()").eq("company_id", companyId).single(),
    supabase.from("invoices").select("total:amount.sum()").eq("company_id", companyId).single(),
  ]);
  if (receiptsSumRes.error) throw receiptsSumRes.error;
  if (paymentsSumRes.error) throw paymentsSumRes.error;
  if (invoicesSumRes.error) throw invoicesSumRes.error;

  return {
    totalReceipts: receiptsCountRes.count ?? 0,
    totalPayments: paymentsCountRes.count ?? 0,
    totalInvoices: invoicesCountRes.count ?? 0,
    totalReceivedAmount: Number((receiptsSumRes.data as { total?: number } | null)?.total ?? 0),
    totalPaidAmount: Number((paymentsSumRes.data as { total?: number } | null)?.total ?? 0),
    totalInvoiceAmount: Number((invoicesSumRes.data as { total?: number } | null)?.total ?? 0),
    activeDocumentsCount:
      (activeReceiptsRes.count ?? 0) + (activePaymentsRes.count ?? 0) + (activeInvoicesRes.count ?? 0),
    cancelledDocumentsCount:
      (cancelledReceiptsRes.count ?? 0) +
      (cancelledPaymentsRes.count ?? 0) +
      (cancelledInvoicesRes.count ?? 0),
  };
}

async function fetchRecentDocuments(supabase: SupabaseClient, companyId: string): Promise<DashboardStats["recentDocuments"]> {
  const [receiptsRes, paymentsRes, invoicesRes] = await Promise.all([
    supabase
      .from("receipt_vouchers")
      .select("id, display_number, party_name, amount, date, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("payment_vouchers")
      .select("id, display_number, party_name, amount, date, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("invoices")
      .select("id, display_number, party_name, amount, date, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (receiptsRes.error) throw receiptsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;

  const normalize = (type: DocumentType, row: Record<string, unknown>) => ({
    id: String(row.id),
    type,
    display_number: String(row.display_number),
    party_name: String(row.party_name),
    amount: Number(row.amount),
    date: String(row.date),
    status: row.status as DocumentStatus,
  });

  return [
    ...(receiptsRes.data ?? []).map((r) => normalize("receipt_voucher", r as Record<string, unknown>)),
    ...(paymentsRes.data ?? []).map((r) => normalize("payment_voucher", r as Record<string, unknown>)),
    ...(invoicesRes.data ?? []).map((r) => normalize("invoice", r as Record<string, unknown>)),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);
}

async function fetchMonthlyActivity(
  supabase: SupabaseClient,
  companyId: string,
  locale: string
): Promise<MonthlyPoint[]> {
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  const startIso = start.toISOString();

  const [receiptsRes, paymentsRes, invoicesRes] = await Promise.all([
    supabase.from("receipt_vouchers").select("date").eq("company_id", companyId).gte("date", startIso),
    supabase.from("payment_vouchers").select("date").eq("company_id", companyId).gte("date", startIso),
    supabase.from("invoices").select("date").eq("company_id", companyId).gte("date", startIso),
  ]);
  if (receiptsRes.error) throw receiptsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;

  const buckets = createMonthBuckets(locale);
  const push = (key: keyof Omit<MonthlyPoint, "month">, rows: RecentRow[] | null) => {
    for (const row of rows ?? []) {
      const mk = monthKeyFromDate(row.date);
      const bucket = buckets.get(mk);
      if (bucket) bucket[key] += 1;
    }
  };

  push("receipts", (receiptsRes.data as RecentRow[] | null) ?? null);
  push("payments", (paymentsRes.data as RecentRow[] | null) ?? null);
  push("invoices", (invoicesRes.data as RecentRow[] | null) ?? null);

  return [...buckets.values()];
}

export async function getTenantDashboardStats(
  supabase: SupabaseClient,
  ctx: TenantContext,
  locale: string
): Promise<DashboardStats> {
  const [metrics, recentDocuments, monthlyActivity] = await Promise.all([
    fetchCountsAndSums(supabase, ctx.companyId),
    fetchRecentDocuments(supabase, ctx.companyId),
    fetchMonthlyActivity(supabase, ctx.companyId, locale),
  ]);

  const subscription = ctx.subscription;
  const expiresAt = subscription?.expires_at ?? new Date().toISOString();
  const status = subscription?.status ?? "trialing";

  return {
    ...metrics,
    subscriptionStatus: status,
    subscriptionExpiresAt: expiresAt,
    daysUntilExpiry: daysUntil(expiresAt),
    monthlyActivity,
    recentDocuments,
  };
}
