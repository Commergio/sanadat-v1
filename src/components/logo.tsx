"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, showText = true, href = "/" }: LogoProps) {
  const t = useTranslations("app");

  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
      <Image
        src={LOGO_SRC}
        alt={t("name")}
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain transition-transform group-hover:scale-105"
        priority
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight">{t("name")}</span>
      )}
    </Link>
  );
}
