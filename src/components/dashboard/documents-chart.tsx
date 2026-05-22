"use client";

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
import { mockChartData } from "@/lib/mock-data";

export function DocumentsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">نشاط المستندات</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mockChartData}>
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
              name="قبض"
              stroke="#4F46E5"
              fill="url(#receipts)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="payments"
              name="صرف"
              stroke="#f59e0b"
              fill="transparent"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="invoices"
              name="فواتير"
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
