"use client";

import { Menu, Bell, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@wrksz/themes/client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useCompany } from "@/hooks/use-company";
import { useAppStore } from "@/stores/app-store";

export function DashboardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { setSidebarOpen } = useAppStore();
  const { company } = useCompany();
  const { theme, setTheme } = useTheme();
  const t = useTranslations("nav");
  const companyName = company?.name ?? "—";

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <LocaleSwitcher variant="compact" className="hidden md:flex" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t("toggleTheme")}
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 end-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
          </Button>
          <SignOutButton />
          <div className="hidden items-center gap-2.5 border-s border-border/80 ps-3 ms-1 sm:flex">
            {company?.logo_url ? (
              <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                <Image
                  src={company.logo_url}
                  alt={companyName}
                  fill
                  className="object-contain p-0.5"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {companyName.charAt(0)}
              </div>
            )}
            <span className="max-w-[140px] truncate text-sm font-medium">{companyName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
