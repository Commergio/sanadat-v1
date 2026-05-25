import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DocumentsChart } from "@/components/dashboard/documents-chart";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SubscriptionAlert } from "@/components/dashboard/subscription-alert";
import { mockDashboardStats } from "@/lib/mock-data";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const stats = mockDashboardStats;

  return (
    <>
      <DashboardHeader title={t("overview")} />
      <main className="flex-1 p-4 lg:p-8 space-y-6">
        <SubscriptionAlert daysUntilExpiry={stats.daysUntilExpiry} />
        <QuickActions />
        <StatsCards stats={stats} />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DocumentsChart />
          </div>
          <div className="lg:col-span-2">
            <RecentDocuments documents={stats.recentDocuments} />
          </div>
        </div>
      </main>
    </>
  );
}
