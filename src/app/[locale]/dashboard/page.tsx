import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { emptyDashboardStats } from "@/lib/placeholders/dashboard";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { createClient } from "@/lib/supabase/server";
import { getTenantDashboardStats } from "@/lib/dashboard/server";
import { TenantResolutionError } from "@/lib/tenant/errors";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let stats = emptyDashboardStats;
  let loadError = false;
  let loadErrorCode: string | undefined;

  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    stats = await getTenantDashboardStats(supabase, ctx, locale);
  } catch (err) {
    loadError = true;
    if (err instanceof TenantResolutionError) {
      loadErrorCode = err.code;
    }
    if (process.env.NODE_ENV === "development") {
      const detail =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
      console.error("[dashboard] load failed:", detail, err);
    }
  }

  return (
    <>
      <DashboardPageHeader />
      <DashboardHome stats={stats} loadError={loadError} loadErrorCode={loadErrorCode} />
    </>
  );
}
