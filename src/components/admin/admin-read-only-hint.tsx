"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminReadOnlyHint() {
  const t = useTranslations("admin");

  return (
    <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
      <Lock className="h-4 w-4 shrink-0" />
      {t("readOnlySupport")}
    </p>
  );
}
