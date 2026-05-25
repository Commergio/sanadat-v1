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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChartData } from "@/lib/mock-data";

export function DocumentsChart() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const data = getChartData(locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("activity")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="receipts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="receipts"
              name={t("receipts")}
              stroke="#4F46E5"
              fill="url(#receipts)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="payments"
              name={t("payments")}
              stroke="#f59e0b"
              fill="transparent"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="invoices"
              name={t("invoices")}
              stroke="#10b981"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
