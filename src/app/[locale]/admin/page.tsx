import { getLocale, getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Users, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const locale = await getLocale();

  const stats = [
    { label: t("totalRevenue"), value: formatCurrency(159600, locale), icon: CreditCard },
    { label: t("activeClients"), value: formatNumber(387, locale), icon: Users },
    { label: t("expiredSubs"), value: formatNumber(23, locale), icon: AlertTriangle },
    { label: t("monthlyGrowth"), value: "+12%", icon: TrendingUp },
  ];

  return (
    <>
      <DashboardHeader title={t("overview")} />
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
            <CardTitle className="text-base">{t("importantNoteTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("note")}</CardContent>
        </Card>
      </main>
    </>
  );
}
