import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <DemoModeBanner />
        {children}
      </div>
    </div>
  );
}
