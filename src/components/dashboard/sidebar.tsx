"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Settings,
  CreditCard,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, usePathname } from "@/i18n/navigation";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/receipts", labelKey: "receipts", icon: ArrowDownLeft },
  { href: "/dashboard/payments", labelKey: "payments", icon: ArrowUpRight },
  { href: "/dashboard/invoices", labelKey: "invoices", icon: FileText },
  { href: "/dashboard/subscription", labelKey: "subscription", icon: CreditCard },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const t = useTranslations("dashboard");

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 end-0 z-50 h-full w-64 border-s border-border bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border">
          <Logo href="/dashboard" showText />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 start-4 end-4 hidden lg:block">
          <LocaleSwitcher variant="compact" className="w-full justify-center" />
        </div>
      </aside>
    </>
  );
}
