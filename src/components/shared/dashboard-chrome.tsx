"use client";

import { usePathname } from "@/i18n/navigation";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import { AppFooterBar } from "@/components/shared/app-footer-bar";

const IMMERSIVE_PREFIXES = ["/dashboard/receipts/new", "/dashboard/payments/new"];

function isImmersiveStudioRoute(pathname: string) {
  return IMMERSIVE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = isImmersiveStudioRoute(pathname);

  return (
    <>
      {!immersive && <DemoModeBanner />}
      {children}
      {!immersive && <AppFooterBar />}
    </>
  );
}
