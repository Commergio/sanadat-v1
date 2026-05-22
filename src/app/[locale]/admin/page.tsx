import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Users, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";

const stats = [
  { label: "إجمالي الإيرادات", value: formatCurrency(159600), icon: CreditCard },
  { label: "العملاء النشطون", value: formatNumber(387), icon: Users },
  { label: "اشتراكات منتهية", value: formatNumber(23), icon: AlertTriangle },
  { label: "نمو شهري", value: "+12%", icon: TrendingUp },
];

export default function AdminDashboardPage() {
  return (
    <>
      <DashboardHeader title="لوحة الإدارة" />
      <main className="p-4 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ملاحظة مهمة</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            المسؤول لا يمكنه تعديل مستندات العملاء — فقط إدارة الحسابات والاشتراكات والمدفوعات.
          </CardContent>
        </Card>
      </main>
    </>
  );
}
