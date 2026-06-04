"use client";

import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { daysUntil } from "@/lib/utils";
import { isRtlLocale } from "@/i18n/routing";
import type { SubscriptionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBilling } from "@/hooks/use-billing";

export function SubscriptionWidget() {
  const t = useTranslations("dashboard.subscriptionWidget");
  const ts = useTranslations("dashboard.stats");
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const { subscription, loading } = useBilling();

  if (loading) {
    return (
      <div className="dashboard-card p-5 sm:p-6">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const status: SubscriptionStatus = subscription?.status ?? "trialing";
  const expiresAtValue = subscription?.expiresAt ?? new Date().toISOString();
  const days = daysUntil(expiresAtValue);
  const progress = Math.max(0, Math.min(100, ((365 - days) / 365) * 100));
  const isActive = status === "active";
  const price = subscription && subscription.amount > 0 ? subscription.amount : SUBSCRIPTION_PRICE;
  const statusLabel =
    status === "active"
      ? ts("active")
      : status === "suspended"
        ? ts("suspended")
        : ts("expired");

  return (
    <div className="dashboard-card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-violet-500/[0.04]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isActive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            )}
          >
            <CreditCard className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {ts("subscription")}
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{statusLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ts("expiresIn", { days })}{" "}
              <span className="text-foreground/80">· {formatDate(expiresAtValue, locale)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <div className="text-end">
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {price}
              <span className="text-sm font-normal text-muted-foreground ms-1">
                {locale === "ar" ? "ر.س/سنة" : "SAR/yr"}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {subscription?.cancelAtPeriodEnd ? t("autoRenewOff") : t("autoRenewOn")}
            </p>
          </div>
          <Link href="/dashboard/subscription">
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0 bg-background/60">
              {t("manage")}
              <Chevron className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="relative mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{t("periodProgress")}</span>
          <span className="tabular-nums font-medium text-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
}
