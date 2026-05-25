"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, showText = true, href = "/" }: LogoProps) {
  const t = useTranslations("app");

  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform group-hover:scale-105">
        <FileText className="h-5 w-5 text-primary-foreground" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight">{t("name")}</span>
      )}
    </Link>
  );
}
