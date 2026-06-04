"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Users,
  UserCheck,
  AlertTriangle,
  DollarSign,
  Clock,
  Ban,
  Sparkles,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminOverviewSkeleton } from "@/components/admin/admin-loading";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminSubscriptionBreakdownChart } from "@/components/admin/admin-charts";
import { usePlatformDashboard } from "@/hooks/use-platform-admin";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export function AdminOverviewContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { stats, recentActions, loading, error, refresh } = usePlatformDashboard();

  if (loading) return <AdminOverviewSkeleton />;

  if (error) {
    return (
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />
    );
  }

  if (!stats) {
    return <AdminEmptyState title={t("loadFailed")} description={t("loadFailedDesc")} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <AdminStatCard
          label={t("totalClients")}
          value={formatNumber(stats.totalCompanies, locale)}
          icon={Users}
        />
        <AdminStatCard
          label={t("activeClients")}
          value={formatNumber(stats.activeCompanies, locale)}
          icon={UserCheck}
          accent="success"
        />
        <AdminStatCard
          label={t("trialing")}
          value={formatNumber(stats.trialingCompanies, locale)}
          icon={Sparkles}
        />
        <AdminStatCard
          label={t("expiredSubs")}
          value={formatNumber(stats.expiredCompanies, locale)}
          icon={AlertTriangle}
          accent="warning"
        />
        <AdminStatCard
          label={t("suspended")}
          value={formatNumber(stats.suspendedCompanies, locale)}
          icon={Ban}
          accent="warning"
        />
        <AdminStatCard
          label={t("totalRevenue")}
          value={formatCurrency(stats.totalRevenue, locale)}
          icon={DollarSign}
          accent="primary"
        />
        <AdminStatCard
          label={t("pending")}
          value={formatNumber(stats.pendingPayments, locale)}
          icon={Clock}
          accent="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="dashboard-card overflow-hidden">
            <div className="border-b border-border/80 px-5 py-4">
              <p className="text-sm font-semibold">{t("recentActivity")}</p>
            </div>
            {recentActions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("noActivity")}
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentActions.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-[10px] font-bold uppercase text-violet-600">
                      {item.entityType.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.entityType} · {item.entityId.slice(0, 8)}…
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(item.createdAt, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <AdminSubscriptionBreakdownChart stats={stats} />
      </div>

      <div className="dashboard-card border-primary/10 bg-primary/[0.03] p-5">
        <p className="text-sm font-semibold">{t("importantNoteTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("note")}</p>
      </div>
    </div>
  );
}
