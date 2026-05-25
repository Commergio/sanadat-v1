"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, usePathname } from "@/i18n/navigation";

const navItems = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard },
  { href: "/admin/clients", labelKey: "clients", icon: Users },
  { href: "/admin/subscriptions", labelKey: "subscriptions", icon: CreditCard },
  { href: "/admin/payments", labelKey: "payments", icon: CreditCard },
  { href: "/admin/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
  { href: "/admin/whatsapp", labelKey: "whatsapp", icon: MessageSquare },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin");

  return (
    <aside className="w-64 border-s border-border bg-card min-h-screen hidden lg:block">
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <Logo href="/admin" />
        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {t("badge")}
        </span>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <LocaleSwitcher variant="compact" />
      </div>
    </aside>
  );
}
