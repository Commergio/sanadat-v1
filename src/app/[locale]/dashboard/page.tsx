import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { mockDashboardStats } from "@/lib/mock-data";

export default function DashboardPage() {
  const stats = mockDashboardStats;

  return (
    <>
      <DashboardPageHeader />
      <DashboardHome stats={stats} />
    </>
  );
}
