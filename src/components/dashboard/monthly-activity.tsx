"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { getEmptyChartData } from "@/lib/placeholders/dashboard";
import type { DashboardStats } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4 text-[10px]">
          <span>{entry.name}</span>
          <span className="font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyActivity({
  compact = false,
  data,
}: {
  compact?: boolean;
  data?: DashboardStats["monthlyActivity"];
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const chartData = data?.length ? data : getEmptyChartData(locale);
  const height = compact ? 220 : 300;

  return (
    <DashboardSection title={t("monthlyActivity")} description={t("activityHint")}>
      <div className="dashboard-card p-3 sm:p-4">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="homeReceipts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area
              type="monotone"
              dataKey="receipts"
              name={t("receiptsShort")}
              stroke="#4f46e5"
              fill="url(#homeReceipts)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="payments"
              name={t("paymentsShort")}
              stroke="#f59e0b"
              fill="transparent"
              strokeWidth={1.5}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="invoices"
              name={t("invoicesShort")}
              stroke="#10b981"
              fill="transparent"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardSection>
  );
}
