"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useAppStore } from "@/stores/app-store";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const { setSidebarOpen } = useAppStore();

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
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
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <LocaleSwitcher variant="compact" />
      </div>
    </header>
  );
}
