"use client";

import { FileText, Plus, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyVariant = "default" | "documents" | "search";

interface EmptyStateProps {
  title: string;
  description: string;
  variant?: EmptyVariant;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  variant = "default",
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  const isSearch = variant === "search";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center",
        className
      )}
    >
      <div className="relative mb-8 h-24 w-28">
        <div className="absolute inset-x-4 bottom-0 h-16 rounded-lg border border-border/80 bg-card shadow-sm" />
        <div className="absolute inset-x-6 bottom-2 h-14 rounded-md border border-border/60 bg-muted/50" />
        <div className="absolute inset-x-8 bottom-4 flex h-12 flex-col gap-1 rounded border border-border/40 bg-background p-2">
          <div className="h-1 w-8 rounded-full bg-muted-foreground/20" />
          <div className="h-1 w-12 rounded-full bg-muted-foreground/15" />
          <div className="h-1 w-6 rounded-full bg-muted-foreground/10" />
        </div>
        <div className="absolute -top-1 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-xl border border-border bg-card shadow-md">
          {isSearch ? (
            <Search className="h-5 w-5 text-primary" strokeWidth={1.5} />
          ) : (
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
          )}
        </div>
        <div className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          A4
        </div>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-6">
          <Button size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
