"use client";

import { ArrowDownLeft, ArrowUpRight, FileText, Shield, FileCheck, Hash } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const steps = [
  {
    href: "/dashboard/receipts/new",
    labelKey: "createReceipt",
    descKey: "receiptDesc",
    icon: ArrowDownLeft,
    accent: "hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/dashboard/payments/new",
    labelKey: "createPayment",
    descKey: "paymentDesc",
    icon: ArrowUpRight,
    accent: "hover:border-amber-500/40 hover:bg-amber-500/[0.04]",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    href: "/dashboard/invoices/new",
    labelKey: "createInvoice",
    descKey: "invoiceDesc",
    icon: FileText,
    accent: "hover:border-violet-500/40 hover:bg-violet-500/[0.04]",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
] as const;

const trust = [
  { icon: Hash, key: "trustSequential" },
  { icon: FileCheck, key: "trustPdf" },
  { icon: Shield, key: "trustImmutable" },
] as const;

export function FirstDocumentOnboarding() {
  const t = useTranslations("dashboard.onboarding");
  const tDash = useTranslations("dashboard");

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="border-b border-border/80 bg-gradient-to-br from-primary/[0.06] via-transparent to-violet-500/[0.04] px-6 py-10 text-center sm:px-10">
        <div className="mx-auto mb-6 flex h-28 w-36 items-end justify-center">
          <div className="relative">
            <div className="absolute -start-3 bottom-2 h-20 w-14 rotate-[-8deg] rounded-md border border-border bg-card shadow-md" />
            <div className="absolute -end-3 bottom-1 h-20 w-14 rotate-[6deg] rounded-md border border-border bg-muted/50 shadow-sm" />
            <div className="relative z-10 h-24 w-16 rounded-md border border-border bg-white p-2 shadow-lg dark:bg-zinc-900">
              <div className="mb-2 h-1 w-6 rounded-full bg-primary/60" />
              <div className="space-y-1">
                <div className="h-0.5 w-full rounded-full bg-muted-foreground/20" />
                <div className="h-0.5 w-[80%] rounded-full bg-muted-foreground/15" />
                <div className="h-0.5 w-[60%] rounded-full bg-muted-foreground/10" />
              </div>
              <p className="mt-2 text-center text-[9px] font-bold text-muted-foreground/40">A4</p>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("title")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
        {steps.map((step) => (
          <Link key={step.href} href={step.href} className="block">
            <div
              className={cn(
                "flex h-full flex-col gap-3 rounded-xl border-2 border-dashed border-border p-4 transition-all",
                step.accent
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", step.iconBg)}>
                <step.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold">{tDash(step.labelKey)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{tDash(step.descKey)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-6 border-t border-border/80 px-6 py-4">
        {trust.map(({ icon: Icon, key }) => (
          <span key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            {tDash(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
