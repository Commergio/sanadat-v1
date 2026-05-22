"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const revenueData = [
  { month: "يناير", revenue: 12000 },
  { month: "فبراير", revenue: 18500 },
  { month: "مارس", revenue: 22000 },
  { month: "أبريل", revenue: 28000 },
  { month: "مايو", revenue: 35000 },
];

export default function AdminAnalyticsPage() {
  return (
    <>
      <DashboardHeader title="التحليلات" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الإيرادات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" name="الإيرادات" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
