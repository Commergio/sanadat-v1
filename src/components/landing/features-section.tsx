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
import { motion } from "framer-motion";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";

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
    <section id="features" className="landing-section bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <SectionHeader label={t("label")} title={t("title")} subtitle={t("subtitle")} />
        </FadeUp>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {featureKeys.map((feature, i) => (
            <FadeUp key={feature.key} delay={i * 0.06}>
              <motion.div
                className="group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card p-8 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-violet-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-indigo-500/10 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:from-primary group-hover:to-indigo-600 group-hover:text-primary-foreground group-hover:ring-primary/30 group-hover:shadow-lg group-hover:shadow-primary/25">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2.5">
                    {t(`items.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`items.${feature.key}.description`)}
                  </p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
