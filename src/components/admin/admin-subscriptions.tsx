"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { useAdminLoading } from "@/components/admin/use-admin-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminSubscriptions, ADMIN_PLAN_PRICE } from "@/lib/mock-admin-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type SubFilter = "all" | "active" | "expired" | "expiring_soon";

export function AdminSubscriptionsContent() {
  const t = useTranslations("admin");
  const ts = useTranslations("dashboard.stats");
  const locale = useLocale();
  const [filter, setFilter] = useState<SubFilter>("all");
  const loading = useAdminLoading();

  const filtered = useMemo(() => {
    if (filter === "all") return adminSubscriptions;
    return adminSubscriptions.filter((s) => s.status === filter);
  }, [filter]);

  const tabs: { key: SubFilter; label: string; count: number }[] = [
    { key: "all", label: t("filterAll"), count: adminSubscriptions.length },
    {
      key: "active",
      label: t("filterActive"),
      count: adminSubscriptions.filter((s) => s.status === "active").length,
    },
    {
      key: "expiring_soon",
      label: t("filterExpiringSoon"),
      count: adminSubscriptions.filter((s) => s.status === "expiring_soon").length,
    },
    {
      key: "expired",
      label: t("filterExpired"),
      count: adminSubscriptions.filter((s) => s.status === "expired").length,
    },
  ];

  const statusLabel = (status: string) => {
    if (status === "active") return ts("active");
    if (status === "expired") return ts("expired");
    return t("expiringSoon");
  };

  if (loading) return <AdminTableSkeleton rows={5} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                filter === tab.key ? "bg-primary-foreground/20" : "bg-muted"
              )}
            >
              {tab.count}
            </span>
          </Button>
        ))}
      </div>

      <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 border-primary/10 bg-primary/[0.03] px-5 py-4">
        <div>
          <p className="text-sm font-semibold">{t("planName")}</p>
          <p className="text-xs text-muted-foreground">{t("planDesc")}</p>
        </div>
        <p className="text-xl font-bold tabular-nums text-primary">
          {formatCurrency(ADMIN_PLAN_PRICE, locale)}
          <span className="text-xs font-normal text-muted-foreground"> / {t("yearly")}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState title={t("noSubscriptions")} description={t("noSubscriptionsDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("clientCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("statusCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("renewalDate")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("amountCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("autoRenewCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="max-w-[140px] px-3 py-3 font-medium sm:max-w-none sm:px-4">
                      <p className="truncate">{s.clientName}</p>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <Badge
                        variant={
                          s.status === "active"
                            ? "success"
                            : s.status === "expiring_soon"
                              ? "warning"
                              : "warning"
                        }
                      >
                        {statusLabel(s.status)}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      {formatDate(s.renewalDate, locale)}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums sm:px-4">
                      {formatCurrency(s.planPrice, locale)}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">{s.autoRenew ? t("yes") : t("no")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
