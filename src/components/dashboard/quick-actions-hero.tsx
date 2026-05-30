"use client";

import { ArrowDownLeft, ArrowUpRight, FileText, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/dashboard/receipts/new",
    labelKey: "createReceipt",
    shortKey: "newReceipt",
    descKey: "receiptDesc",
    icon: ArrowDownLeft,
    accent: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-card hover:border-emerald-500/40",
    iconWrap: "bg-emerald-500 text-white shadow-emerald-500/25 shadow-lg",
    cta: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600",
  },
  {
    href: "/dashboard/payments/new",
    labelKey: "createPayment",
    shortKey: "newPayment",
    descKey: "paymentDesc",
    icon: ArrowUpRight,
    accent: "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-card hover:border-amber-500/40",
    iconWrap: "bg-amber-500 text-white shadow-amber-500/25 shadow-lg",
    cta: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600",
  },
  {
    href: "/dashboard/invoices/new",
    labelKey: "createInvoice",
    shortKey: "newInvoice",
    descKey: "invoiceDesc",
    icon: FileText,
    accent: "border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-card hover:border-violet-500/40",
    iconWrap: "bg-violet-600 text-white shadow-violet-500/25 shadow-lg",
    cta: "bg-violet-600 hover:bg-violet-700 dark:bg-violet-600",
  },
] as const;

function MiniDocPreview({ variant }: { variant: "receipt" | "payment" | "invoice" }) {
  const bar =
    variant === "receipt"
      ? "bg-emerald-500/60"
      : variant === "payment"
        ? "bg-amber-500/60"
        : "bg-violet-500/60";

  return (
    <div className="pointer-events-none absolute bottom-4 end-4 hidden w-[72px] rotate-3 rounded-md border border-border/80 bg-white p-2 shadow-md dark:bg-zinc-900 sm:block">
      <div className={cn("mb-1.5 h-1 w-8 rounded-full", bar)} />
      <div className="space-y-1">
        <div className="h-0.5 w-full rounded-full bg-muted-foreground/15" />
        <div className="h-0.5 w-4/5 rounded-full bg-muted-foreground/10" />
        <div className="h-0.5 w-3/5 rounded-full bg-muted-foreground/10" />
      </div>
      <p className="mt-1.5 text-[8px] font-bold text-muted-foreground/50">A4</p>
    </div>
  );
}

export function QuickActionsHero() {
  const t = useTranslations("dashboard");

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("platformLabel")}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          {t("platformHeadline")}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("platformSubline")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((action, i) => {
          const variant =
            action.labelKey === "createReceipt"
              ? "receipt"
              : action.labelKey === "createPayment"
                ? "payment"
                : "invoice";

          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <Link href={action.href} className="group block h-full">
                <div
                  className={cn(
                    "relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-2xl border-2 p-5 transition-all duration-200",
                    "hover:-translate-y-1 hover:shadow-lg",
                    action.accent
                  )}
                >
                  <MiniDocPreview variant={variant} />

                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                        action.iconWrap
                      )}
                    >
                      <action.icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 sm:pe-16">
                      <p className="text-base font-bold tracking-tight">{t(action.labelKey)}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t(action.descKey)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors",
                      action.cta
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    {t(action.shortKey)}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("trustSequential")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {t("trustPdf")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          {t("trustImmutable")}
        </span>
      </div>
    </section>
  );
}
