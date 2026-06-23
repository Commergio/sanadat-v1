import type { SupabaseClient } from "@supabase/supabase-js";
import { TRIAL_DOCUMENT_LIMIT } from "@/lib/constants";
import type { SubscriptionStatus } from "@/lib/types";

export interface TenantDocumentUsage {
  receiptsCount: number;
  paymentsCount: number;
  invoicesCount: number;
  totalDocuments: number;
  trialLimit: number;
  remainingDocuments: number;
  subscriptionStatus: SubscriptionStatus | null;
  canCreateDocument: boolean;
}

export interface TrialUsageContext {
  companyId: string;
}

export async function countCompanyDocuments(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ receiptsCount: number; paymentsCount: number; invoicesCount: number }> {
  const [receiptsRes, paymentsRes, invoicesRes] = await Promise.all([
    supabase
      .from("receipt_vouchers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("payment_vouchers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
  ]);

  if (receiptsRes.error) throw receiptsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;

  return {
    receiptsCount: receiptsRes.count ?? 0,
    paymentsCount: paymentsRes.count ?? 0,
    invoicesCount: invoicesRes.count ?? 0,
  };
}

async function resolveSubscriptionStatus(
  supabase: SupabaseClient,
  companyId: string
): Promise<SubscriptionStatus | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.status as SubscriptionStatus | undefined) ?? null;
}

function buildUsage(
  counts: { receiptsCount: number; paymentsCount: number; invoicesCount: number },
  subscriptionStatus: SubscriptionStatus | null
): TenantDocumentUsage {
  const totalDocuments = counts.receiptsCount + counts.paymentsCount + counts.invoicesCount;
  const trialLimit = TRIAL_DOCUMENT_LIMIT;
  const remainingDocuments =
    subscriptionStatus === "trialing" ? Math.max(0, trialLimit - totalDocuments) : 0;

  const canCreateDocument =
    subscriptionStatus === "active" ||
    (subscriptionStatus === "trialing" && totalDocuments < trialLimit);

  return {
    ...counts,
    totalDocuments,
    trialLimit,
    remainingDocuments,
    subscriptionStatus,
    canCreateDocument,
  };
}

export async function getTenantDocumentUsage(
  supabase: SupabaseClient,
  ctx: TrialUsageContext
): Promise<TenantDocumentUsage> {
  const [counts, subscriptionStatus] = await Promise.all([
    countCompanyDocuments(supabase, ctx.companyId),
    resolveSubscriptionStatus(supabase, ctx.companyId),
  ]);

  return buildUsage(counts, subscriptionStatus);
}

export const TRIAL_LIMIT_MESSAGE_EN =
  "Trial limit reached. You can create up to 5 documents during the trial. Please subscribe to continue.";

export const TRIAL_LIMIT_MESSAGE_AR =
  "انتهت حدود الفترة التجريبية. يمكنك إنشاء 5 مستندات فقط خلال التجربة. يرجى الاشتراك للمتابعة.";

export const SUBSCRIPTION_INACTIVE_MESSAGE_EN =
  "An active subscription is required to create documents. Please renew your subscription.";

export const SUBSCRIPTION_INACTIVE_MESSAGE_AR =
  "يتطلب إنشاء المستندات اشتراكاً نشطاً. يرجى تجديد اشتراكك.";
