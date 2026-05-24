import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import { FloatingSupport } from "@/components/shared/floating-support";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DemoModeBanner />
        {children}
      </div>
      <FloatingSupport />
    </div>
  );
}
