import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppFooterBar } from "@/components/shared/app-footer-bar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
