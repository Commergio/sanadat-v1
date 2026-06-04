"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { SubscriptionStatusBadge } from "@/components/admin/admin-status-badges";
import { Button } from "@/components/ui/button";
import { usePlatformSubscriptions } from "@/hooks/use-platform-admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import type { SubscriptionStatus } from "@/lib/types";

type SubFilter = "all" | SubscriptionStatus;

export function AdminSubscriptionsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [filter, setFilter] = useState<SubFilter>("all");
  const [page, setPage] = useState(1);

  const subscriptionStatus = filter === "all" ? undefined : filter;

  const { data, loading, error, refresh } = usePlatformSubscriptions({
    subscriptionStatus,
    page,
    limit: 20,
  });

  const tabs: { key: SubFilter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: t("filterActive") },
    { key: "trialing", label: t("trialing") },
    { key: "expired", label: t("filterExpired") },
    { key: "suspended", label: t("suspended") },
    { key: "cancelled", label: t("cancelled") },
  ];

  if (loading && !data) return <AdminTableSkeleton rows={5} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 border-primary/10 bg-primary/[0.03] px-5 py-4">
        <div>
          <p className="text-sm font-semibold">{t("planName")}</p>
          <p className="text-xs text-muted-foreground">{t("planDesc")}</p>
        </div>
        <p className="text-xl font-bold tabular-nums text-primary">
          {formatCurrency(SUBSCRIPTION_PRICE, locale)}
          <span className="text-xs font-normal text-muted-foreground"> / {t("yearly")}</span>
        </p>
      </div>

      {items.length === 0 && !loading ? (
        <AdminEmptyState title={t("noSubscriptions")} description={t("noSubscriptionsDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("clientCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("statusCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("planCode")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("billingCycle")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("expiryCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("renewalDate")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("amountCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.subscriptionId ?? s.companyId}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="max-w-[160px] px-3 py-3 font-medium sm:px-4">
                      <Link
                        href={`/admin/clients/${s.companyId}`}
                        className="truncate hover:text-primary hover:underline"
                      >
                        {s.companyName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <SubscriptionStatusBadge status={s.subscriptionStatus} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{s.planCode ?? "—"}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">{s.billingCycle ?? "—"}</td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      {s.subscriptionExpiresAt
                        ? formatDate(s.subscriptionExpiresAt, locale)
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      {s.nextRenewalAt ? formatDate(s.nextRenewalAt, locale) : "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums sm:px-4">
                      {s.planAmount != null
                        ? formatCurrency(s.planAmount, locale)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="border-t border-border/80 px-4 py-3">
              <AdminPagination
                page={data.page}
                limit={data.limit}
                total={data.total}
                onPageChange={setPage}
                labels={{ prev: t("pagePrev"), next: t("pageNext"), page: t("pageLabel") }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
