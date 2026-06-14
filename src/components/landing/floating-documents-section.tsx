"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { HeroA4Invoice } from "@/components/landing/hero/hero-a4-invoice";
import { HeroReceiptCard } from "@/components/landing/hero/hero-receipt-card";
import { HeroPaymentCard } from "@/components/landing/hero/hero-payment-card";
import { cn } from "@/lib/utils";

type DocumentKind = "invoice" | "receipt" | "payment";

const showcaseItems: {
  kind: DocumentKind;
  quoteKey: "quote1" | "quote2" | "quote3" | "quote4";
  float: { duration: number; delay: number; rotate: number };
}[] = [
  { kind: "receipt", quoteKey: "quote1", float: { duration: 5.2, delay: 0, rotate: -3 } },
  { kind: "invoice", quoteKey: "quote2", float: { duration: 6, delay: 0.4, rotate: 2 } },
  { kind: "payment", quoteKey: "quote3", float: { duration: 5.6, delay: 0.2, rotate: 3 } },
  { kind: "receipt", quoteKey: "quote4", float: { duration: 5.8, delay: 0.6, rotate: -2 } },
];

function FloatingDocument({
  kind,
  float,
}: {
  kind: DocumentKind;
  float: { duration: number; delay: number; rotate: number };
}) {
  return (
    <motion.div
      className="relative shrink-0"
      animate={{
        y: [0, -14, 0],
        rotate: [float.rotate, float.rotate + 1.5, float.rotate],
      }}
      transition={{
        duration: float.duration,
        delay: float.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/8 blur-2xl"
        aria-hidden
      />
      {kind === "invoice" && (
        <HeroA4Invoice className="w-[min(100%,200px)] shadow-2xl shadow-indigo-500/15 sm:w-[220px]" />
      )}
      {kind === "receipt" && (
        <HeroReceiptCard className="shadow-xl shadow-emerald-500/10" />
      )}
      {kind === "payment" && (
        <HeroPaymentCard className="shadow-xl shadow-amber-500/10" />
      )}
    </motion.div>
  );
}

function MotivationalQuote({
  quoteKey,
  accent,
}: {
  quoteKey: "quote1" | "quote2" | "quote3" | "quote4";
  accent: "emerald" | "indigo" | "amber" | "violet";
}) {
  const t = useTranslations("floatingDocs");

  const accentStyles = {
    emerald:
      "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    indigo:
      "from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-500/20 text-indigo-700 dark:text-indigo-300",
    amber:
      "from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-300",
    violet:
      "from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/20 text-violet-700 dark:text-violet-300",
  };

  return (
    <motion.div
      className={cn(
        "hero-glass relative max-w-md rounded-2xl border bg-gradient-to-br p-5 sm:p-6",
        accentStyles[accent]
      )}
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Sparkles className="mb-3 h-5 w-5 opacity-70" aria-hidden />
      <p className="text-base font-semibold leading-relaxed text-foreground sm:text-lg">
        {t(quoteKey)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${quoteKey}Hint`)}</p>
    </motion.div>
  );
}

const accentByIndex: ("emerald" | "indigo" | "amber" | "violet")[] = [
  "emerald",
  "indigo",
  "amber",
  "violet",
];

export function FloatingDocumentsSection() {
  const t = useTranslations("floatingDocs");

  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-muted/20 py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 start-1/4 h-64 w-64 rounded-full bg-emerald-400/8 blur-[100px]" />
        <div className="absolute bottom-0 end-1/4 h-72 w-72 rounded-full bg-indigo-500/8 blur-[110px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mb-12 text-center sm:mb-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("label")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{t("title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </FadeUp>

        <div className="space-y-14 sm:space-y-20 lg:space-y-24">
          {showcaseItems.map((item, index) => {
            const reversed = index % 2 === 1;
            return (
              <FadeUp key={item.quoteKey} delay={index * 0.08}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-8 sm:gap-10 lg:gap-16",
                    reversed ? "lg:flex-row-reverse" : "lg:flex-row",
                    "lg:items-center lg:justify-between"
                  )}
                >
                  <div className="flex w-full justify-center lg:w-auto lg:shrink-0">
                    <FloatingDocument kind={item.kind} float={item.float} />
                  </div>
                  <div className="flex w-full justify-center lg:flex-1 lg:justify-start">
                    <MotivationalQuote
                      quoteKey={item.quoteKey}
                      accent={accentByIndex[index]!}
                    />
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
