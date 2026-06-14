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
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, usePathname } from "@/i18n/navigation";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";

const mainNav = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/receipts", labelKey: "receipts", icon: ArrowDownLeft },
  { href: "/dashboard/payments", labelKey: "payments", icon: ArrowUpRight },
  { href: "/dashboard/invoices", labelKey: "invoices", icon: FileText },
] as const;

const accountNav = [
  { href: "/dashboard/subscription", labelKey: "subscription", icon: CreditCard },
  { href: "/dashboard/support", labelKey: "supportNav", icon: LifeBuoy },
  { href: "/dashboard/settings/company", labelKey: "settings", icon: Settings },
  { href: "/dashboard/settings/team", labelKey: "team", icon: Settings },
] as const;

function NavItem({
  item,
  pathname,
  onNavigate,
  t,
}: {
  item: (typeof mainNav)[number] | (typeof accountNav)[number];
  pathname: string;
  onNavigate: () => void;
  t: (key: string) => string;
}) {
  const isActive =
    "exact" in item && item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {isActive && (
        <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary" />
      )}
      <item.icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 stroke-[1.75]",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {t(item.labelKey)}
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const t = useTranslations("dashboard");
  const tNav = useTranslations("dashboard.nav");

  const close = () => setSidebarOpen(false);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "flex h-full w-[260px] shrink-0 flex-col border-e border-border bg-card/95 backdrop-blur-xl",
          "max-lg:fixed max-lg:inset-y-0 max-lg:inset-inline-start-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-300",
          sidebarOpen
            ? "max-lg:translate-x-0"
            : "max-lg:-translate-x-full rtl:max-lg:translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4">
          <Logo href="/dashboard" showText />
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
              {tNav("main")}
            </p>
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onNavigate={close} t={t} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
              {tNav("account")}
            </p>
            <div className="space-y-0.5">
              {accountNav.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onNavigate={close} t={t} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-border/80 p-3 space-y-2">
          <LocaleSwitcher variant="compact" className="w-full justify-center" />
        </div>
      </aside>
    </>
  );
}
