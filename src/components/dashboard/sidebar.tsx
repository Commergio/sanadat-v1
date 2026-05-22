"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/ar/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/ar/dashboard/receipts", label: "سندات القبض", icon: ArrowDownLeft },
  { href: "/ar/dashboard/payments", label: "سندات الصرف", icon: ArrowUpRight },
  { href: "/ar/dashboard/invoices", label: "الفواتير", icon: FileText },
  { href: "/ar/dashboard/subscription", label: "الاشتراك", icon: CreditCard },
  { href: "/ar/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

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
          "fixed top-0 right-0 z-50 h-full w-64 border-l border-border bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border">
          <Logo href="/ar/dashboard" showText />
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
              pathname === item.href ||
              (item.href !== "/ar/dashboard" && pathname.startsWith(item.href));
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
