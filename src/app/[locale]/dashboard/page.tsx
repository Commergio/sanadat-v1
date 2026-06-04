import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { emptyDashboardStats } from "@/lib/placeholders/dashboard";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { createClient } from "@/lib/supabase/server";
import { getTenantDashboardStats } from "@/lib/dashboard/server";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let stats = emptyDashboardStats;
  let loadError = false;

  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    stats = await getTenantDashboardStats(supabase, ctx, locale);
  } catch {
    loadError = true;
  }

  return (
    <>
      <DashboardPageHeader />
      <DashboardHome stats={stats} loadError={loadError} />
    </>
  );
}
