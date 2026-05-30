import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import { AppFooterBar } from "@/components/shared/app-footer-bar";
import { FloatingSupport } from "@/components/shared/floating-support";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="dashboard-shell flex min-w-0 flex-1 flex-col">
        <DemoModeBanner />
        {children}
        <AppFooterBar />
      </div>
      <FloatingSupport />
    </div>
  );
}
