"use client";

import { Menu, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useCompany } from "@/hooks/use-company";
import { useAppStore } from "@/stores/app-store";

export function DashboardHeader({ title }: { title: string }) {
  const { setSidebarOpen } = useAppStore();
  const { company } = useCompany();
  const { theme, setTheme } = useTheme();
  const companyName = company?.name ?? "منشأتي";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="h-4 w-4 hidden dark:block" />
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <SignOutButton />
        <div className="hidden sm:flex items-center gap-2 mr-2">
          {company?.logo_url ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-border bg-white">
              <Image
                src={company.logo_url}
                alt={companyName}
                fill
                className="object-contain p-0.5"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {companyName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium truncate max-w-[120px]">
            {companyName}
          </span>
        </div>
      </div>
    </header>
  );
}
