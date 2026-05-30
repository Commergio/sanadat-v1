"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";
import { cn } from "@/lib/utils";

const faqKeys = ["edit", "cancel", "tax", "subscription", "payments"] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="landing-section bg-surface">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <SectionHeader label={t("label")} title={t("title")} className="mb-12" />
        </FadeUp>

        <div className="space-y-3">
          {faqKeys.map((key, i) => (
            <FadeUp key={key} delay={i * 0.05}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 p-5 text-start"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium text-sm">{t(`items.${key}.q`)}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      open === i && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {t(`items.${key}.a`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
