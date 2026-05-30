import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import { AppFooterBar } from "@/components/shared/app-footer-bar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="dashboard-shell flex min-w-0 flex-1 flex-col">
        <DemoModeBanner />
        {children}
        <AppFooterBar showAdminLink={false} />
      </div>
    </div>
  );
}
