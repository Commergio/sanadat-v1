import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { emptyDashboardStats } from "@/lib/placeholders/dashboard";

export default function DashboardPage() {
  const stats = emptyDashboardStats;

  return (
    <>
      <DashboardPageHeader />
      <DashboardHome stats={stats} />
    </>
  );
}
