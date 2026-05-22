"use client";

import { ArrowDownLeft, ArrowUpRight, FileText, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const cards = [
  { key: "totalReceipts" as const, label: "سندات القبض", icon: ArrowDownLeft, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
  { key: "totalPayments" as const, label: "سندات الصرف", icon: ArrowUpRight, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  { key: "totalInvoices" as const, label: "الفواتير", icon: FileText, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatNumber(stats[card.key])}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الاشتراك</p>
                <p className="text-lg font-bold mt-1 text-primary">
                  {stats.subscriptionStatus === "active" ? "نشط" : "منتهي"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ينتهي خلال {stats.daysUntilExpiry} يوم
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-primary bg-primary/10">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
