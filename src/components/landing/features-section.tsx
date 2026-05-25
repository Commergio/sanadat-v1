"use client";

import {
  FileText,
  Shield,
  Hash,
  Smartphone,
  Printer,
  Building2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";

const featureKeys = [
  { key: "types", icon: FileText },
  { key: "numbering", icon: Hash },
  { key: "legal", icon: Shield },
  { key: "export", icon: Printer },
  { key: "responsive", icon: Smartphone },
  { key: "scale", icon: Building2 },
] as const;

export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section id="features" className="py-24 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">{t("label")}</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </FadeUp>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((feature, i) => (
            <FadeUp key={feature.key} delay={i * 0.08}>
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`items.${feature.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`items.${feature.key}.description`)}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
