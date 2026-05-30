"use client";

import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AutosaveStatus } from "@/hooks/use-draft-autosave";
import { cn } from "@/lib/utils";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

export function AutosaveIndicator({ status, lastSavedAt, className }: AutosaveIndicatorProps) {
  const t = useTranslations("documents");
  const locale = useLocale();

  const timeLabel =
    lastSavedAt &&
    lastSavedAt.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      calendar: "gregory",
    });

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs",
        status === "saved" &&
          "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
        status === "saving" && "border-border bg-muted/50 text-muted-foreground",
        status === "error" && "border-destructive/30 bg-destructive/5 text-destructive",
        status === "idle" && "border-border bg-muted/30 text-muted-foreground",
        className
      )}
      aria-live="polite"
    >
      {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === "saved" && <Check className="h-3.5 w-3.5" />}
      {status === "error" && <CloudOff className="h-3.5 w-3.5" />}
      {status === "idle" && <Cloud className="h-3.5 w-3.5" />}

      <span>
        {status === "saving" && t("autosaveSaving")}
        {status === "saved" && (timeLabel ? t("autosaveSavedAt", { time: timeLabel }) : t("autosaveSaved"))}
        {status === "error" && t("autosaveError")}
        {status === "idle" && t("autosaveIdle")}
      </span>
    </div>
  );
}
