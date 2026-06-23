import type { SupabaseClient } from "@supabase/supabase-js";
import { TRIAL_DOCUMENT_LIMIT } from "@/lib/constants";
import type { SubscriptionStatus } from "@/lib/types";

export type DocumentCreateBlockReason =
  | "trial_limit"
  | "trial_expired"
  | "subscription_expired"
  | "subscription_inactive"
  | null;

export interface TenantDocumentUsage {
  receiptsCount: number;
  paymentsCount: number;
  invoicesCount: number;
  totalDocuments: number;
  trialLimit: number;
  remainingDocuments: number;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionExpiresAt: string | null;
  subscriptionPeriodActive: boolean;
  blockReason: DocumentCreateBlockReason;
  canCreateDocument: boolean;
}

export function isSubscriptionPeriodActive(
  expiresAt: string | null | undefined,
  now = new Date()
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > now;
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

interface ResolvedSubscription {
  status: SubscriptionStatus | null;
  expiresAt: string | null;
}

async function resolveSubscription(
  supabase: SupabaseClient,
  companyId: string
): Promise<ResolvedSubscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return {
    status: (data?.status as SubscriptionStatus | undefined) ?? null,
    expiresAt: data?.expires_at ? String(data.expires_at) : null,
  };
}

function resolveBlockReason(
  subscriptionStatus: SubscriptionStatus | null,
  subscriptionPeriodActive: boolean,
  totalDocuments: number,
  trialLimit: number
): DocumentCreateBlockReason {
  if (subscriptionStatus === "trialing") {
    if (!subscriptionPeriodActive) return "trial_expired";
    if (totalDocuments >= trialLimit) return "trial_limit";
    return null;
  }

  if (subscriptionStatus === "active") {
    if (!subscriptionPeriodActive) return "subscription_expired";
    return null;
  }

  if (subscriptionStatus != null) return "subscription_inactive";
  return "subscription_inactive";
}

function buildUsage(
  counts: { receiptsCount: number; paymentsCount: number; invoicesCount: number },
  subscription: ResolvedSubscription
): TenantDocumentUsage {
  const subscriptionStatus = subscription.status;
  const subscriptionExpiresAt = subscription.expiresAt;
  const subscriptionPeriodActive = isSubscriptionPeriodActive(subscriptionExpiresAt);
  const totalDocuments = counts.receiptsCount + counts.paymentsCount + counts.invoicesCount;
  const trialLimit = TRIAL_DOCUMENT_LIMIT;
  const remainingDocuments =
    subscriptionStatus === "trialing" && subscriptionPeriodActive
      ? Math.max(0, trialLimit - totalDocuments)
      : 0;

  const canCreateDocument =
    (subscriptionStatus === "active" && subscriptionPeriodActive) ||
    (subscriptionStatus === "trialing" &&
      subscriptionPeriodActive &&
      totalDocuments < trialLimit);

  const blockReason = canCreateDocument
    ? null
    : resolveBlockReason(
        subscriptionStatus,
        subscriptionPeriodActive,
        totalDocuments,
        trialLimit
      );

  return {
    ...counts,
    totalDocuments,
    trialLimit,
    remainingDocuments,
    subscriptionStatus,
    subscriptionExpiresAt,
    subscriptionPeriodActive,
    blockReason,
    canCreateDocument,
  };
}

export async function getTenantDocumentUsage(
  supabase: SupabaseClient,
  ctx: TrialUsageContext
): Promise<TenantDocumentUsage> {
  const [counts, subscription] = await Promise.all([
    countCompanyDocuments(supabase, ctx.companyId),
    resolveSubscription(supabase, ctx.companyId),
  ]);

  return buildUsage(counts, subscription);
}

export const TRIAL_LIMIT_MESSAGE_EN =
  "Trial limit reached. You can create up to 5 documents during the trial. Please subscribe to continue.";

export const TRIAL_LIMIT_MESSAGE_AR =
  "انتهت حدود الفترة التجريبية. يمكنك إنشاء 5 مستندات فقط خلال التجربة. يرجى الاشتراك للمتابعة.";

export const SUBSCRIPTION_INACTIVE_MESSAGE_EN =
  "An active subscription is required to create documents. Please renew your subscription.";

export const SUBSCRIPTION_INACTIVE_MESSAGE_AR =
  "يتطلب إنشاء المستندات اشتراكاً نشطاً. يرجى تجديد اشتراكك.";

export const SUBSCRIPTION_EXPIRED_MESSAGE_EN =
  "Your one-year subscription has ended. Renew your subscription to create receipt vouchers, payment vouchers, and invoices.";

export const SUBSCRIPTION_EXPIRED_MESSAGE_AR =
  "انتهت صلاحية اشتراكك (مدة سنة واحدة). يرجى تجديد الاشتراك لإصدار سندات القبض والصرف والفواتير.";
