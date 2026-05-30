"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { getChartData, mockDashboardStats } from "@/lib/mock-data";

interface HeroAnalyticsCardProps {
  className?: string;
}

export function HeroAnalyticsCard({ className }: HeroAnalyticsCardProps) {
  const locale = useLocale();
  const t = useTranslations("hero.visual");
  const chartData = getChartData(locale);
  const last = chartData[chartData.length - 1];
  const maxVal = Math.max(
    ...chartData.flatMap((d) => [d.receipts, d.payments, d.invoices])
  );

  const stats = [
    { label: t("receipts"), value: mockDashboardStats.totalReceipts, color: "bg-primary" },
    { label: t("payments"), value: mockDashboardStats.totalPayments, color: "bg-amber-500" },
    { label: t("invoices"), value: mockDashboardStats.totalInvoices, color: "bg-emerald-500" },
  ];

  return (
    <motion.div
      className={cn("hero-glass w-[min(100%,260px)] rounded-2xl p-4", className)}
      initial={{ opacity: 0, y: -12, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 3 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{t("analyticsTitle")}</p>
          <p className="text-[10px] text-muted-foreground">{t("thisMonth")}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-muted/50 px-2 py-1.5 text-center ring-1 ring-border/50"
          >
            <p className="text-[9px] text-muted-foreground truncate">{s.label}</p>
            <p className="text-sm font-bold tabular-nums">{formatNumber(s.value, locale)}</p>
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <div className="mt-3 flex h-14 items-end justify-between gap-1 rounded-lg bg-muted/30 px-2 pb-2 pt-3">
        {chartData.map((d, i) => {
          const total = d.receipts + d.payments + d.invoices;
          const h = Math.max(12, (total / (maxVal * 3)) * 100);
          const isLast = i === chartData.length - 1;
          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full max-w-[18px] rounded-sm transition-colors",
                  isLast ? "bg-primary" : "bg-primary/35"
                )}
                style={{ height: `${h}%` }}
              />
              <span className="text-[6px] text-muted-foreground truncate max-w-full">
                {d.month.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{t("receipts")}</span>
        <span className="font-semibold tabular-nums text-primary">
          +{last.receipts} {t("thisMonth").toLowerCase()}
        </span>
      </div>
    </motion.div>
  );
}
