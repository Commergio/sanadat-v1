"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  ScrollText,
  Settings,
  Megaphone,
  LifeBuoy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Link, usePathname } from "@/i18n/navigation";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/clients", labelKey: "clients", icon: Users },
  { href: "/admin/subscriptions", labelKey: "subscriptions", icon: CreditCard },
  { href: "/admin/payments", labelKey: "payments", icon: Wallet },
  { href: "/admin/actions", labelKey: "actionsNav", icon: ScrollText },
  { href: "/admin/announcements", labelKey: "announcementsNav", icon: Megaphone },
  { href: "/admin/support", labelKey: "supportNav", icon: LifeBuoy },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const t = useTranslations("admin");

  const content = (
    <>
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border/80 px-4">
        <Logo href="/admin" showText className="min-w-0 shrink" />
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {t("badge")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary" />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "flex h-full w-[260px] shrink-0 flex-col border-e border-border bg-card/95 backdrop-blur-xl",
          "max-lg:fixed max-lg:inset-y-0 max-lg:inset-inline-start-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-300",
          sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
