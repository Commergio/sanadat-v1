"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrialUsage } from "@/hooks/use-trial-usage";
import { Skeleton } from "@/components/ui/skeleton";

export function TrialUsageWidget() {
  const t = useTranslations("dashboard.trialUsage");
  const { usage, loading } = useTrialUsage();

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  if (!usage || usage.subscriptionStatus !== "trialing") {
    return null;
  }

  const used = usage.totalDocuments;
  const limit = usage.trialLimit;
  const remaining = usage.remainingDocuments ?? 0;
  const exhausted = remaining <= 0;

  return (
    <div
      className={
        exhausted
          ? "rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/40"
          : "rounded-xl border border-border/80 bg-card p-4"
      }
    >
      <p className="text-sm font-semibold text-foreground">{t("title")}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("usedOfLimit", { used, limit })}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">
        {t("remaining", { remaining })}
      </p>
      {exhausted && (
        <Button asChild size="sm" className="mt-3">
          <Link href="/dashboard/subscription">{t("subscribeCta")}</Link>
        </Button>
      )}
    </div>
  );
}

interface TrialDocumentCreateNoticeProps {
  className?: string;
}

export function TrialDocumentCreateNotice({ className }: TrialDocumentCreateNoticeProps) {
  const t = useTranslations("documents");
  const { usage, loading } = useTrialUsage();

  if (loading || !usage) {
    return null;
  }

  if (usage.subscriptionStatus === "trialing") {
    const remaining = usage.remainingDocuments ?? 0;
    const exhausted = !usage.canCreateDocument || remaining <= 0;

    return (
      <div
        className={
          exhausted
            ? `rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/40 ${className ?? ""}`
            : `rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm ${className ?? ""}`
        }
      >
        <div className="flex gap-2">
          <AlertTriangle
            className={
              exhausted
                ? "mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                : "mt-0.5 h-4 w-4 shrink-0 text-primary"
            }
          />
          <div className="space-y-2">
            <p className="font-medium text-foreground">
              {exhausted
                ? usage.blockReason === "trial_expired"
                  ? t("trialExpiredBannerTitle")
                  : t("trialLimitBannerTitle")
                : t("trialRemainingBanner", { remaining })}
            </p>
            {exhausted ? (
              <>
                <p className="text-muted-foreground">
                  {usage.blockReason === "trial_expired"
                    ? t("trialExpiredBannerHint")
                    : t("trialLimitBannerHint")}
                </p>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/dashboard/subscription">{t("trialSubscribeCta")}</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                {t("trialUsedOfLimit", {
                  used: usage.totalDocuments,
                  limit: usage.trialLimit,
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!usage.canCreateDocument) {
    const isExpiredYear = usage.blockReason === "subscription_expired";

    return (
      <div
        className={`rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/40 ${className ?? ""}`}
      >
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-2">
            <p className="font-medium text-foreground">
              {isExpiredYear ? t("subscriptionExpiredBannerTitle") : t("subscriptionInactiveBannerTitle")}
            </p>
            <p className="text-muted-foreground">
              {isExpiredYear ? t("subscriptionExpiredBannerHint") : t("subscriptionInactiveBannerHint")}
            </p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard/subscription">{t("trialSubscribeCta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function useTrialCreateBlocked() {
  const { usage, loading } = useTrialUsage();
  const blocked = !loading && usage != null && !usage.canCreateDocument;

  return { blocked, loading, usage };
}
