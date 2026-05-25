"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  className?: string;
  variant?: "default" | "compact";
}

export function LocaleSwitcher({
  className,
  variant = "default",
}: LocaleSwitcherProps) {
  const t = useTranslations("locale");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex rounded-lg border border-border bg-muted/50 p-0.5",
          className
        )}
        role="group"
        aria-label={t("switch")}
      >
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              locale === l
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l === "ar" ? "ع" : "EN"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="sr-only">{t("switch")}</span>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchLocale(l)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {t(l)}
        </button>
      ))}
    </div>
  );
}
