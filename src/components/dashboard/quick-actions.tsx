"use client";

import { Plus, ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const actions = [
  {
    href: "/dashboard/receipts/new",
    labelKey: "newReceipt",
    icon: ArrowDownLeft,
    color: "hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
  },
  {
    href: "/dashboard/payments/new",
    labelKey: "newPayment",
    icon: ArrowUpRight,
    color: "hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
  },
  {
    href: "/dashboard/invoices/new",
    labelKey: "newInvoice",
    icon: FileText,
    color: "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
  },
] as const;

export function QuickActions() {
  const t = useTranslations("dashboard");

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action, i) => (
        <motion.div
          key={action.href}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link href={action.href}>
            <div
              className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 ${action.color}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("create")}</p>
                <p className="text-sm font-semibold">{t(action.labelKey)}</p>
              </div>
              <Plus className="h-4 w-4 ms-auto text-muted-foreground" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
