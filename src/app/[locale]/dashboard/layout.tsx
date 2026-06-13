import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardChrome } from "@/components/shared/dashboard-chrome";
import { FloatingSupport } from "@/components/shared/floating-support";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden">
        <DashboardSidebar />
        <div className="dashboard-shell flex w-full min-w-0 flex-1 flex-col">
          <DashboardChrome>{children}</DashboardChrome>
        </div>
      </div>
      <FloatingSupport />
    </>
  );
}
