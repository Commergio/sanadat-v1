"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminRevenueChartData } from "@/lib/mock-admin-data";
import type { PlatformDashboardStatsModel } from "@/lib/platform/api-client";
import { formatCurrency, formatNumber } from "@/lib/format";

export function AdminRevenueChart() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const data = locale === "ar" ? adminRevenueChartData.ar : adminRevenueChartData.en;

  return (
    <div className="dashboard-card p-5">
      <p className="mb-4 text-sm font-semibold">{t("monthlyRevenue")}</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v, locale)} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), locale)}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="revenue" name={t("monthlyRevenue")} fill="#4f46e5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminClientGrowthChart() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const data = locale === "ar" ? adminRevenueChartData.ar : adminRevenueChartData.en;

  return (
    <div className="dashboard-card p-5">
      <p className="mb-4 text-sm font-semibold">{t("clientGrowth")}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="clients"
            name={t("activeClients")}
            stroke="#059669"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminSubscriptionBreakdownChart({
  stats,
}: {
  stats: PlatformDashboardStatsModel;
}) {
  const t = useTranslations("admin");
  const data = [
    { name: t("filterActive"), value: stats.activeCompanies, color: "#059669" },
    { name: t("trialing"), value: stats.trialingCompanies, color: "#6366f1" },
    { name: t("filterExpired"), value: stats.expiredCompanies, color: "#dc2626" },
    { name: t("suspended"), value: stats.suspendedCompanies, color: "#d97706" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="dashboard-card p-5">
        <p className="mb-4 text-sm font-semibold">{t("subscriptionBreakdown")}</p>
        <p className="text-sm text-muted-foreground py-8 text-center">{t("noActivity")}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-5">
      <p className="mb-4 text-sm font-semibold">{t("subscriptionBreakdown")}</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name}: {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
