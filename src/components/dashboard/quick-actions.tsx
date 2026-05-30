"use client";

import { Plus, ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/dashboard/receipts/new",
    labelKey: "newReceipt",
    descKey: "receiptDesc",
    icon: ArrowDownLeft,
    ring: "hover:ring-emerald-500/25",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/dashboard/payments/new",
    labelKey: "newPayment",
    descKey: "paymentDesc",
    icon: ArrowUpRight,
    ring: "hover:ring-amber-500/25",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    href: "/dashboard/invoices/new",
    labelKey: "newInvoice",
    descKey: "invoiceDesc",
    icon: FileText,
    ring: "hover:ring-violet-500/25",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
] as const;

export function QuickActions() {
  const t = useTranslations("dashboard");

  return (
    <DashboardSection title={t("quickActions")} description={t("quickActionsHint")}>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
          >
            <Link href={action.href} className="block h-full">
              <div
                className={cn(
                  "dashboard-card group flex h-full flex-col gap-4 p-5 ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md",
                  action.ring
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                      action.iconBg
                    )}
                  >
                    <action.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">{t(action.labelKey)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(action.descKey)}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </DashboardSection>
  );
}
