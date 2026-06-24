"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, Lock } from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { daysUntil } from "@/lib/utils";
import { ManualBankTransferSection } from "@/components/subscription/manual-bank-transfer-section";
import { InvitationCodeSection } from "@/components/subscription/invitation-code-section";
import { SubscriptionCouponFields } from "@/components/subscription/subscription-coupon-fields";
import type { BillingPaymentApi, BillingSubscriptionApi } from "@/lib/billing/client";
import { cn } from "@/lib/utils";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/types";

function subscriptionBadgeVariant(
  status: SubscriptionStatus
): "success" | "warning" | "destructive" | "secondary" {
  if (status === "active") return "success";
  if (status === "trialing") return "secondary";
  if (status === "suspended") return "warning";
  return "destructive";
}

function paymentBadgeVariant(
  status: PaymentStatus
): "success" | "warning" | "destructive" | "secondary" {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "failed") return "destructive";
  return "secondary";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SubscriptionBillingPanel() {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const {
    subscription,
    payments,
    loading,
    loadError,
    canManage,
    checkoutResult,
    checkoutLoading,
    checkoutError,
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponLoading,
    couponError,
    applyCoupon,
    clearCoupon,
    startCheckout,
    refresh,
    latestPendingPayment,
    latestFailedPayment,
    pendingManualRequest,
  } = useBilling();

  const checkoutReturn = searchParams.get("checkout");
  const isCheckoutSuccess = checkoutReturn === "success";
  const isSubscriptionActive = subscription?.status === "active";

  useEffect(() => {
    if (checkoutReturn === "cancelled") {
      toast.message(t("checkoutReturnCancelled"));
    }
  }, [checkoutReturn, t]);

  useEffect(() => {
    if (!isCheckoutSuccess || loading) return;

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 3000);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 30000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isCheckoutSuccess, loading, refresh]);

  const handleApplyCoupon = useCallback(async () => {
    const ok = await applyCoupon();
    if (ok) {
      toast.success(t("couponAppliedSuccess"));
    }
  }, [applyCoupon, t]);

  const handleStartCheckout = useCallback(async () => {
    const result = await startCheckout();
    if (result?.reusedPending) {
      toast.message(t("pendingPaymentExists"));
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      }
    }
  }, [startCheckout, t]);

  const statusLabel = (status: SubscriptionStatus) => {
    const map: Record<SubscriptionStatus, string> = {
      active: t("active"),
      expired: t("statusExpired"),
      suspended: t("statusSuspended"),
      trialing: t("statusTrialing"),
      cancelled: t("statusCancelled"),
    };
    return map[status] ?? status;
  };

  const paymentStatusLabel = (status: PaymentStatus) => {
    const map: Record<PaymentStatus, string> = {
      pending: t("paymentPending"),
      completed: t("paymentCompleted"),
      failed: t("paymentFailedStatus"),
      refunded: t("paymentRefunded"),
    };
    return map[status] ?? status;
  };

  const gatewayLabel = (gateway: string) => {
    if (gateway === "manual") return t("gatewayManual");
    return gateway;
  };

  const subscriptionSourceLabel = (source: BillingSubscriptionApi["subscriptionSource"]) => {
    const map: Record<BillingSubscriptionApi["subscriptionSource"], string> = {
      trial: t("subscriptionSourceTrial"),
      paid: t("subscriptionSourcePaid"),
      promo: t("subscriptionSourcePromo"),
      admin_grant: t("subscriptionSourceAdminGrant"),
    };
    return map[source] ?? source;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError?.code === "FORBIDDEN" && (
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <Lock className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{t("forbiddenTitle")}</p>
            <p className="mt-0.5 text-muted-foreground">{t("forbiddenHint")}</p>
          </div>
        </div>
      )}

      {loadError?.code === "NOT_IMPLEMENTED" && (
        <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/40">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {t("serviceUnavailableTitle")}
            </p>
            <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">{t("serviceUnavailableHint")}</p>
          </div>
        </div>
      )}

      {loadError && loadError.code !== "FORBIDDEN" && loadError.code !== "NOT_IMPLEMENTED" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError.message}
        </div>
      )}

      {isCheckoutSuccess && isSubscriptionActive && subscription && (
        <div className="flex gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            {t("checkoutRenewedSuccess", {
              expiresAt: formatDate(subscription.expiresAt, locale),
            })}
          </p>
        </div>
      )}

      {isCheckoutSuccess && !isSubscriptionActive && !loading && (
        <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          <p className="font-medium text-foreground">{t("checkoutActivating")}</p>
        </div>
      )}

      {latestPendingPayment && !(isCheckoutSuccess && isSubscriptionActive) && (
        <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/40">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">{t("pendingPaymentTitle")}</p>
            <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">{t("pendingPaymentHint")}</p>
          </div>
        </div>
      )}

      {latestFailedPayment && !latestPendingPayment && (
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{t("paymentFailedBannerTitle")}</p>
            <p className="mt-0.5 text-muted-foreground">{t("paymentFailedBannerHint")}</p>
          </div>
        </div>
      )}

      {!subscription && !loadError && (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t("noSubscriptionTitle")}</p>
          <p className="mt-1">{t("noSubscriptionHint")}</p>
        </div>
      )}

      {subscription && (
        <SubscriptionDetailsCard
          subscription={subscription}
          locale={locale}
          statusLabel={statusLabel}
          subscriptionSourceLabel={subscriptionSourceLabel}
          t={t}
        />
      )}

      <ManualBankTransferSection
        canManage={canManage}
        pendingRequest={pendingManualRequest}
        onSubmitted={refresh}
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        appliedCoupon={appliedCoupon}
        couponLoading={couponLoading}
        couponError={couponError}
        onApplyCoupon={handleApplyCoupon}
        onClearCoupon={clearCoupon}
      />

      <InvitationCodeSection canManage={canManage} onApplied={refresh} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("paymentHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistoryTable
            payments={payments}
            locale={locale}
            paymentStatusLabel={paymentStatusLabel}
            gatewayLabel={gatewayLabel}
            pendingManualReview={pendingManualRequest?.status === "pending"}
            emptyLabel={t("noPayments")}
            labels={{
              amount: t("colAmount"),
              currency: t("colCurrency"),
              gateway: t("colGateway"),
              status: t("colStatus"),
              paidAt: t("colPaidAt"),
              failedAt: t("colFailedAt"),
              gatewayReference: t("colGatewayReference"),
              couponCode: t("colCouponCode"),
              discountAmount: t("colDiscountAmount"),
              finalAmount: t("colFinalAmount"),
              manualReviewTitle: t("manualTransferPendingTitle"),
              manualReviewHint: t("manualTransferPendingMessage"),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("renew")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              {t("readOnlyHint")}
            </p>
          )}

          {canManage && (
            <>
              <p className="text-sm text-muted-foreground">{t("checkoutHintMoyasar")}</p>

              <SubscriptionCouponFields
                locale={locale}
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                appliedCoupon={appliedCoupon}
                couponLoading={couponLoading}
                couponError={couponError}
                onApply={handleApplyCoupon}
                onClear={clearCoupon}
                disabled={checkoutLoading}
              />

              <Button
                onClick={() => void handleStartCheckout()}
                disabled={checkoutLoading || loadError?.code === "NOT_IMPLEMENTED"}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("renewing")}
                  </>
                ) : (
                  t("renew")
                )}
              </Button>
              {checkoutError && (
                <p className="text-sm text-destructive">
                  {checkoutError === "FORBIDDEN" ? t("forbiddenHint") : checkoutError}
                </p>
              )}
            </>
          )}

          {checkoutResult && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-2">
              <p className="font-medium text-foreground">{t("checkoutCreated")}</p>
              <DetailRow
                label={t("checkoutSessionId")}
                value={
                  <code className="text-xs break-all">{checkoutResult.checkoutSessionId}</code>
                }
              />
              <DetailRow
                label={t("gatewayReference")}
                value={
                  <code className="text-xs break-all">{checkoutResult.gatewayReference}</code>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionDetailsCard({
  subscription,
  locale,
  statusLabel,
  subscriptionSourceLabel,
  t,
}: {
  subscription: BillingSubscriptionApi;
  locale: string;
  statusLabel: (s: SubscriptionStatus) => string;
  subscriptionSourceLabel: (s: BillingSubscriptionApi["subscriptionSource"]) => string;
  t: ReturnType<typeof useTranslations<"subscription">>;
}) {
  const days = daysUntil(subscription.expiresAt);
  const price = subscription.amount > 0 ? subscription.amount : SUBSCRIPTION_PRICE;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("status")}
          </CardTitle>
          <Badge variant={subscriptionBadgeVariant(subscription.status)}>
            {statusLabel(subscription.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <DetailRow
          label={t("subscriptionSource")}
          value={subscriptionSourceLabel(subscription.subscriptionSource)}
        />
        <DetailRow label={t("planCode")} value={subscription.planCode} />
        <DetailRow
          label={t("billingCycle")}
          value={subscription.billingCycle === "yearly" ? t("billingCycleYearly") : subscription.billingCycle}
        />
        <DetailRow
          label={t("yearlyAmount")}
          value={formatCurrency(price, locale)}
        />
        <DetailRow label={t("startsAt")} value={formatDate(subscription.startsAt, locale)} />
        <DetailRow label={t("expiryDate")} value={formatDate(subscription.expiresAt, locale)} />
        <DetailRow label={t("remaining")} value={t("days", { days })} />
        <DetailRow
          label={t("nextRenewalAt")}
          value={
            subscription.nextRenewalAt
              ? formatDate(subscription.nextRenewalAt, locale)
              : "—"
          }
        />
        <DetailRow
          label={t("cancelAtPeriodEnd")}
          value={subscription.cancelAtPeriodEnd ? t("yes") : t("no")}
        />
      </CardContent>
    </Card>
  );
}

function PaymentHistoryTable({
  payments,
  locale,
  paymentStatusLabel,
  gatewayLabel,
  pendingManualReview,
  emptyLabel,
  labels,
}: {
  payments: BillingPaymentApi[];
  locale: string;
  paymentStatusLabel: (s: PaymentStatus) => string;
  gatewayLabel: (gateway: string) => string;
  pendingManualReview?: boolean;
  emptyLabel: string;
  labels: Record<string, string>;
}) {
  if (payments.length === 0 && !pendingManualReview) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const showCouponColumns = payments.some(
    (p) => p.couponCode || p.discountAmount || p.originalAmount
  );

  return (
    <>
      {pendingManualReview && (
        <div className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/40">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            {labels.manualReviewTitle}
          </p>
          <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">{labels.manualReviewHint}</p>
        </div>
      )}
      {payments.length === 0 ? null : (
    <>
      <div className="space-y-3 md:hidden">
        {payments.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold tabular-nums">
                {formatCurrency(p.amount, locale)} {p.currency}
              </span>
              <Badge variant={paymentBadgeVariant(p.status)} className="font-normal">
                {paymentStatusLabel(p.status)}
              </Badge>
            </div>
            <div className="grid gap-1 text-xs text-muted-foreground">
              <p>
                {labels.gateway}: {gatewayLabel(p.gateway)}
              </p>
              {showCouponColumns && p.couponCode ? (
                <p>
                  {labels.couponCode}: {p.couponCode}
                </p>
              ) : null}
              {showCouponColumns && p.discountAmount != null && p.discountAmount > 0 ? (
                <p>
                  {labels.discountAmount}: {formatCurrency(p.discountAmount, locale)}
                </p>
              ) : null}
              {showCouponColumns ? (
                <p>
                  {labels.finalAmount}: {formatCurrency(p.amount, locale)}
                </p>
              ) : null}
              {p.status === "completed" && p.paidAt ? (
                <p>
                  {labels.paidAt}: {formatDate(p.paidAt, locale)}
                </p>
              ) : null}
              {p.status === "failed" && p.failedAt ? (
                <p>
                  {labels.failedAt}: {formatDate(p.failedAt, locale)}
                </p>
              ) : null}
              {p.status === "pending" ? (
                <p>{labels.status}: {paymentStatusLabel(p.status)}</p>
              ) : null}
              {p.gatewayReference ? (
                <p className="break-all">
                  {labels.gatewayReference}: {p.gatewayReference}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pe-3 text-start font-medium">{labels.amount}</th>
            {showCouponColumns ? (
              <>
                <th className="py-2 pe-3 text-start font-medium">{labels.couponCode}</th>
                <th className="py-2 pe-3 text-start font-medium">{labels.discountAmount}</th>
                <th className="py-2 pe-3 text-start font-medium">{labels.finalAmount}</th>
              </>
            ) : null}
            <th className="py-2 pe-3 text-start font-medium">{labels.currency}</th>
            <th className="py-2 pe-3 text-start font-medium">{labels.gateway}</th>
            <th className="py-2 pe-3 text-start font-medium">{labels.status}</th>
            <th className="hidden py-2 pe-3 text-start font-medium lg:table-cell">{labels.paidAt}</th>
            <th className="hidden py-2 pe-3 text-start font-medium xl:table-cell">{labels.failedAt}</th>
            <th className="hidden py-2 text-start font-medium lg:table-cell">{labels.gatewayReference}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pe-3 tabular-nums">
                {p.originalAmount != null && p.originalAmount > p.amount
                  ? formatCurrency(p.originalAmount, locale)
                  : formatCurrency(p.amount, locale)}
              </td>
              {showCouponColumns ? (
                <>
                  <td className="py-2.5 pe-3 font-mono text-xs">{p.couponCode ?? "—"}</td>
                  <td className="py-2.5 pe-3 tabular-nums">
                    {p.discountAmount != null && p.discountAmount > 0
                      ? formatCurrency(p.discountAmount, locale)
                      : "—"}
                  </td>
                  <td className="py-2.5 pe-3 tabular-nums">{formatCurrency(p.amount, locale)}</td>
                </>
              ) : null}
              <td className="py-2.5 pe-3">{p.currency}</td>
              <td className="py-2.5 pe-3">{gatewayLabel(p.gateway)}</td>
              <td className="py-2.5 pe-3">
                <Badge variant={paymentBadgeVariant(p.status)} className="font-normal">
                  {paymentStatusLabel(p.status)}
                </Badge>
              </td>
              <td className={cn("hidden py-2.5 pe-3 text-muted-foreground lg:table-cell", !p.paidAt && "text-foreground/40")}>
                {p.paidAt ? formatDate(p.paidAt, locale) : "—"}
              </td>
              <td className={cn("hidden py-2.5 pe-3 text-muted-foreground xl:table-cell", !p.failedAt && "text-foreground/40")}>
                {p.failedAt ? formatDate(p.failedAt, locale) : "—"}
              </td>
              <td className="hidden py-2.5 lg:table-cell">
                <code className="text-xs break-all text-muted-foreground">
                  {p.gatewayReference ?? "—"}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
      )}
    </>
  );
}
