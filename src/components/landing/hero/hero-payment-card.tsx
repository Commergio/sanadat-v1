"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { mockPayment } from "@/lib/mock-data";

interface HeroPaymentCardProps {
  className?: string;
}

export function HeroPaymentCard({ className }: HeroPaymentCardProps) {
  const locale = useLocale();
  const t = useTranslations("hero.visual");
  const td = useTranslations("dashboard.table");

  return (
    <motion.div
      className={cn(
        "hero-glass w-[min(100%,240px)] rounded-2xl p-4 ring-1 ring-amber-500/10",
        className
      )}
      initial={{ opacity: 0, y: 16, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 3 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
          <CheckCircle2 className="h-3 w-3" />
          {td("active")}
        </span>
      </div>

      <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("payments")}
      </p>
      <p className="font-mono text-xs text-muted-foreground">{mockPayment.display_number}</p>

      <p className="mt-2 line-clamp-1 text-sm font-semibold text-foreground">
        {mockPayment.party_name}
      </p>
      <p className="text-[10px] text-muted-foreground">{formatDate(mockPayment.date, locale)}</p>

      <div className="mt-3 flex items-end justify-between border-t border-border/60 pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground">{t("paidVia")}</p>
          <p className="text-xs font-medium">{mockPayment.bank_name}</p>
        </div>
        <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
          − {formatCurrency(mockPayment.amount, locale)}
        </p>
      </div>
    </motion.div>
  );
}
