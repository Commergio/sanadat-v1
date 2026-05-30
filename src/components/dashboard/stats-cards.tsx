"use client";

import { ArrowDownLeft, ArrowUpRight, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
}

const cards = [
  {
    key: "totalReceipts" as const,
    labelKey: "receipts",
    icon: ArrowDownLeft,
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    trend: "+12%",
  },
  {
    key: "totalPayments" as const,
    labelKey: "payments",
    icon: ArrowUpRight,
    accent: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
    trend: "+8%",
  },
  {
    key: "totalInvoices" as const,
    labelKey: "invoices",
    icon: FileText,
    accent: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
    trend: "+5%",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations("dashboard.stats");
  const tDash = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35 }}
          className="dashboard-card group p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{t(card.labelKey)}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                {formatNumber(stats[card.key], locale)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-medium">{card.trend}</span>
                <span className="text-muted-foreground">{tDash("statsTrend")}</span>
              </div>
            </div>
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                card.accent
              )}
            >
              <card.icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
