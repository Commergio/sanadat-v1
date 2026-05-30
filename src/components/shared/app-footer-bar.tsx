"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PrototypeBadge } from "@/components/shared/prototype-badge";
import { IS_DEMO_MODE } from "@/lib/constants";

interface AppFooterBarProps {
  showAdminLink?: boolean;
}

export function AppFooterBar({ showAdminLink = IS_DEMO_MODE }: AppFooterBarProps) {
  const t = useTranslations("demo");

  if (!IS_DEMO_MODE) return null;

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/20 px-4 py-2.5 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <PrototypeBadge />
        <div className="flex flex-wrap items-center gap-3">
          {showAdminLink && (
            <Link
              href="/admin"
              className="font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t("adminPanel")}
            </Link>
          )}
          <span>{t("prototypeNote")}</span>
        </div>
      </div>
    </footer>
  );
}
