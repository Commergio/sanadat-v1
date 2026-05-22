"use client";

import Link from "next/link";
import { Plus, ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const actions = [
  {
    href: "/ar/dashboard/receipts/new",
    label: "سند قبض",
    icon: ArrowDownLeft,
    color: "hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
  },
  {
    href: "/ar/dashboard/payments/new",
    label: "سند صرف",
    icon: ArrowUpRight,
    color: "hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
  },
  {
    href: "/ar/dashboard/invoices/new",
    label: "فاتورة",
    icon: FileText,
    color: "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
  },
];

export function QuickActions() {
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
                <p className="text-sm font-medium">إنشاء</p>
                <p className="text-sm font-semibold">{action.label}</p>
              </div>
              <Plus className="h-4 w-4 mr-auto text-muted-foreground" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
