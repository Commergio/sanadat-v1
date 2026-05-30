"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { mockReceipt } from "@/lib/mock-data";

interface HeroReceiptCardProps {
  className?: string;
}

export function HeroReceiptCard({ className }: HeroReceiptCardProps) {
  const locale = useLocale();
  const t = useTranslations("hero.visual");
  const td = useTranslations("dashboard.table");

  return (
    <motion.div
      className={cn(
        "hero-glass w-[min(100%,240px)] rounded-2xl p-4 ring-1 ring-emerald-500/10",
        className
      )}
      initial={{ opacity: 0, y: 16, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -3 }}
      transition={{ duration: 0.7, delay: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ArrowDownLeft className="h-4 w-4" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          {td("active")}
        </span>
      </div>

      <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("receiptLabel")}
      </p>
      <p className="font-mono text-xs text-muted-foreground">{mockReceipt.display_number}</p>

      <p className="mt-2 line-clamp-1 text-sm font-semibold text-foreground">
        {mockReceipt.party_name}
      </p>
      <p className="text-[10px] text-muted-foreground">{formatDate(mockReceipt.date, locale)}</p>

      <div className="mt-3 flex items-end justify-between border-t border-border/60 pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground">{t("paidVia")}</p>
          <p className="text-xs font-medium">{mockReceipt.bank_name}</p>
        </div>
        <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(mockReceipt.amount, locale)}
        </p>
      </div>
    </motion.div>
  );
}
