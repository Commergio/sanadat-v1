"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Headphones,
  Play,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/fade-up";
import { HeroVisualShowcase } from "@/components/landing/hero/hero-visual-showcase";
import { isRtlLocale } from "@/i18n/routing";
import { IS_DEMO_MODE } from "@/lib/constants";

const trustItems = [
  { icon: Users, key: "socialProof" as const },
  { icon: Star, key: "trustRating" as const, suffix: "trustRatingLabel" as const },
  { icon: ShieldCheck, key: "trustSecure" as const },
  { icon: Headphones, key: "trustSupport" as const },
];

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pt-36 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 start-1/2 h-[640px] w-[min(100%,920px)] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 via-indigo-500/5 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 xl:gap-16">
          {/* Copy — primary on all breakpoints */}
          <div className="relative z-20 order-1">
            <FadeUp>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t("badge")}
              </div>
            </FadeUp>

            <FadeUp delay={0.06}>
              <h1 className="max-w-none text-[2rem] font-bold leading-[1.08] tracking-tight sm:max-w-[18ch] sm:text-5xl lg:max-w-[14ch] lg:text-[3.5rem] xl:text-[4rem]">
                {t("title1")}{" "}
                <span className="bg-gradient-to-l from-primary via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-primary dark:to-violet-400">
                  {t("title1Highlight")}
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.12}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("subtitle")}
              </p>
            </FadeUp>

            <FadeUp delay={0.18}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href={IS_DEMO_MODE ? "/login" : "/register"} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-12 w-full sm:w-auto gap-2 px-8 text-base shadow-xl shadow-primary/30 sm:h-14"
                  >
                    {IS_DEMO_MODE ? t("ctaDemoLogin") : t("ctaPrimary")}
                    <Arrow className="h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href={IS_DEMO_MODE ? "/dashboard" : "/register"}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 w-full sm:w-auto border-primary/25 bg-background/80 px-8 text-base backdrop-blur-sm hover:bg-primary/5 sm:h-14"
                  >
                    {IS_DEMO_MODE ? t("ctaDemoExplore") : t("ctaTrial")}
                  </Button>
                </Link>
              </div>
              <a
                href="#features"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <Play className="h-4 w-4" />
                {t("ctaSecondary")}
              </a>
            </FadeUp>

            <FadeUp delay={0.26}>
              <div className="mt-12 grid gap-3 sm:grid-cols-2">
                {trustItems.map(({ icon: Icon, key, suffix }) => (
                  <div
                    key={key}
                    className="hero-glass flex items-center gap-3 rounded-xl px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {key === "trustRating"
                          ? `${t("trustRating")}/5 · ${t(suffix!)}`
                          : t(key)}
                      </p>
                      {key === "socialProof" && (
                        <p className="text-xs text-muted-foreground">{t("trustCompliance")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Visual — supporting */}
          <motion.div
            className="relative order-2 lg:scale-[0.92] lg:origin-center xl:scale-95"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            <HeroVisualShowcase className="mx-auto max-w-[440px] lg:max-w-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
