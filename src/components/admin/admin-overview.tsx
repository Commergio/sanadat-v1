"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Users,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Repeat,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminOverviewSkeleton } from "@/components/admin/admin-loading";
import { useAdminLoading } from "@/components/admin/use-admin-loading";
import {
  AdminClientGrowthChart,
  AdminRevenueChart,
  AdminSubscriptionBreakdownChart,
} from "@/components/admin/admin-charts";
import { adminOverviewStats, adminRecentActivity } from "@/lib/mock-admin-data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const activityColors = {
  payment: "bg-blue-500/10 text-blue-600",
  subscription: "bg-emerald-500/10 text-emerald-600",
  client: "bg-amber-500/10 text-amber-600",
  system: "bg-violet-500/10 text-violet-600",
};

export function AdminOverviewContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const loading = useAdminLoading();
  const stats = adminOverviewStats;

  if (loading) return <AdminOverviewSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard
          label={t("totalClients")}
          value={formatNumber(stats.totalClients, locale)}
          icon={Users}
        />
        <AdminStatCard
          label={t("activeClients")}
          value={formatNumber(stats.activeClients, locale)}
          icon={UserCheck}
          accent="success"
        />
        <AdminStatCard
          label={t("expiredSubs")}
          value={formatNumber(stats.expiredSubscriptions, locale)}
          icon={AlertTriangle}
          accent="warning"
        />
        <AdminStatCard
          label={t("monthlyRevenue")}
          value={formatCurrency(stats.monthlyRevenue, locale)}
          icon={DollarSign}
          accent="primary"
        />
        <AdminStatCard
          label={t("arr")}
          value={formatCurrency(stats.arr, locale)}
          hint={t("arrHint")}
          icon={Repeat}
          accent="primary"
        />
        <AdminStatCard
          label={t("monthlyGrowth")}
          value={`+${stats.monthlyGrowth}%`}
          icon={TrendingUp}
          accent="success"
          trend={t("vsLastMonth")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminRevenueChart />
        <AdminClientGrowthChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="dashboard-card overflow-hidden">
            <div className="border-b border-border/80 px-5 py-4">
              <p className="text-sm font-semibold">{t("recentActivity")}</p>
            </div>
            <ul className="divide-y divide-border/60">
              {adminRecentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase",
                      activityColors[item.type]
                    )}
                  >
                    {item.type.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{t(item.descriptionKey, { client: item.clientName })}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(item.time.split("T")[0], locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AdminSubscriptionBreakdownChart />
      </div>

      <div className="dashboard-card border-primary/10 bg-primary/[0.03] p-5">
        <p className="text-sm font-semibold">{t("importantNoteTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("note")}</p>
      </div>
    </div>
  );
}
