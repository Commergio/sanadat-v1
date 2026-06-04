import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppFooterBar } from "@/components/shared/app-footer-bar";
import { requirePlatformPageAccess } from "@/lib/auth/require-platform-page";
import type { Locale } from "@/i18n/routing";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const headerList = await headers();
  const returnTo =
    headerList.get("x-pathname") ?? `/${locale}/admin`;

  await requirePlatformPageAccess(locale as Locale, returnTo);

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden">
      <AdminSidebar />
      <div className="dashboard-shell flex min-w-0 flex-1 flex-col">
        {children}
        <AppFooterBar showAdminLink={false} />
      </div>
    </div>
  );
}
