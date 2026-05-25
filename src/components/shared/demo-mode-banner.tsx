"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IS_DEMO_MODE } from "@/lib/constants";

export function DemoModeBanner() {
  const t = useTranslations("demo");

  if (!IS_DEMO_MODE) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-center text-sm">
      <div className="flex flex-wrap items-center justify-center gap-2 text-primary">
        <Eye className="h-4 w-4 shrink-0" />
        <span>{t("banner")}</span>
        <Link href="/login" className="underline font-medium hover:no-underline">
          {t("signInLater")}
        </Link>
      </div>
    </div>
  );
}
