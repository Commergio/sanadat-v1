"use client";

import { FilePlus2, FileDown, MessageCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";
import { isRtlLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const steps = [
  { key: "1" as const, icon: FilePlus2, color: "from-primary to-indigo-600" },
  { key: "2" as const, icon: FileDown, color: "from-violet-600 to-indigo-600" },
  { key: "3" as const, icon: MessageCircle, color: "from-emerald-500 to-teal-600" },
];

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const Connector = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="how-it-works" className="landing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <SectionHeader label={t("label")} title={t("title")} subtitle={t("subtitle")} />
        </FadeUp>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
          {/* Connector line — desktop */}
          <div
            className="pointer-events-none absolute top-[4.5rem] hidden h-px md:block inset-x-[16%]"
            aria-hidden
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {steps.map((step, i) => (
            <FadeUp key={step.key} delay={i * 0.12}>
              <motion.div
                className="relative flex h-full flex-col items-center text-center md:items-start md:text-start"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="relative mb-6">
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-primary/20",
                      step.color
                    )}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -top-2 -end-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card text-xs font-bold text-primary shadow-sm">
                    {step.key}
                  </span>
                </div>

                <div className="hero-glass w-full rounded-2xl p-6 text-center md:text-start">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>

                {i < steps.length - 1 && (
                  <Connector className="mx-auto my-4 h-5 w-5 text-primary/40 md:hidden" />
                )}
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
