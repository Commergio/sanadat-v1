"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { IS_DEMO_MODE } from "@/lib/constants";

interface PrototypeBadgeProps {
  className?: string;
}

export function PrototypeBadge({ className }: PrototypeBadgeProps) {
  const t = useTranslations("demo");

  if (!IS_DEMO_MODE) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 dark:text-amber-300",
        className
      )}
    >
      {t("prototypeBadge")}
    </span>
  );
}
