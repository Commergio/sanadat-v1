"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  className?: string;
}

export function StudioSection({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
  className,
}: StudioSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted",
            iconClassName
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
