"use client";

import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { useCompany } from "@/hooks/use-company";
import { isRtlLocale } from "@/i18n/routing";
import type { SubscriptionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SubscriptionCompactProps {
  daysUntilExpiry: number;
  status?: SubscriptionStatus;
}

export function SubscriptionCompact({
  daysUntilExpiry,
  status = "active",
}: SubscriptionCompactProps) {
  const t = useTranslations("dashboard.subscriptionWidget");
  const ts = useTranslations("dashboard.stats");
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const { subscription } = useCompany();
  const expiresAt = subscription?.expires_at ?? new Date().toISOString();
  const isActive = status === "active";
  const statusLabel =
    status === "active" ? ts("active") : status === "suspended" ? ts("suspended") : ts("expired");

  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              isActive ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"
            )}
          >
            <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {ts("subscription")}
            </p>
            <p className="truncate text-sm font-medium">{statusLabel}</p>
            <p className="text-[11px] text-muted-foreground">
              {ts("expiresIn", { days: daysUntilExpiry })}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          {t("manage")}
          <Chevron className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground/80">
        {formatDate(expiresAt, locale)}
      </p>
    </div>
  );
}
