"use client";

import { Check, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SUBSCRIPTION_PRICE, IS_DEMO_MODE } from "@/lib/constants";

const featureKeys = [
  "unlimitedVouchers",
  "invoices",
  "numbering",
  "pdf",
  "whatsapp",
  "analytics",
  "support",
  "autoRenew",
] as const;

const paymentMethods = [
  { id: "mada", label: "مدى", style: "font-bold text-[#004D40]" },
  { id: "visa", label: "VISA", style: "font-bold text-[#1A1F71] tracking-wider" },
  { id: "apple", label: "Apple Pay", style: "font-semibold" },
  { id: "stc", label: "STC Pay", style: "font-bold text-[#4F008C]" },
  { id: "moyasar", label: "Moyasar", style: "font-semibold text-primary" },
  { id: "hyperpay", label: "HyperPay", style: "font-semibold text-muted-foreground" },
];

export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="landing-section bg-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <SectionHeader label={t("label")} title={t("title")} subtitle={t("subtitle")} />
        </FadeUp>

        <FadeUp delay={0.1} className="mx-auto max-w-lg">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card shadow-2xl shadow-primary/15"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-violet-500" />

            <div className="absolute top-5 start-5 end-5 flex justify-center sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                <Sparkles className="h-3.5 w-3.5" />
                {t("popular")}
              </span>
            </div>

            <div className="px-8 pt-14 pb-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t("yearly")}</p>
              <div className="mt-3 flex items-baseline justify-center gap-2">
                <span className="text-6xl font-bold tracking-tight text-foreground tabular-nums">
                  {SUBSCRIPTION_PRICE}
                </span>
                <span className="text-lg text-muted-foreground">{t("perYear")}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {t("monthlyEquiv")}
              </p>
              <div className="mt-4 inline-flex flex-col gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-2">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {t("savings")}
                </span>
                <span className="text-xs text-muted-foreground">{t("savingsHint")}</span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{t("renewal")}</p>
            </div>

            <div className="border-t border-border/60 px-8 py-8">
              <ul className="grid gap-3 sm:grid-cols-2">
                {featureKeys.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    <span className="text-muted-foreground">{t(`features.${f}`)}</span>
                  </li>
                ))}
              </ul>

              <Link href={IS_DEMO_MODE ? "/login" : "/register"} className="mt-8 block">
                <Button size="lg" className="h-12 w-full text-base shadow-lg shadow-primary/25 sm:h-14">
                  {t("cta")}
                </Button>
              </Link>

              <div className="mt-8">
                <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("gateways")}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex h-9 min-w-[4.5rem] items-center justify-center rounded-lg border border-border/80 bg-background/80 px-3 text-[11px] shadow-sm"
                    >
                      <span className={pm.style}>{pm.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
