"use client";

import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";

const stepKeys = ["1", "2", "3", "4"] as const;

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">{t("label")}</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
        </FadeUp>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stepKeys.map((step, i) => (
            <FadeUp key={step} delay={i * 0.1}>
              <div className="relative">
                <div className="text-4xl font-bold text-primary/20 mb-4">
                  {step.padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`steps.${step}.description`)}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
