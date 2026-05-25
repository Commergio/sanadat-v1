"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/fade-up";
import { DocumentPreviewCard } from "@/components/documents/document-preview-card";
import { isRtlLocale } from "@/i18n/routing";

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 end-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 start-1/4 h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-950/30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <FadeUp>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {t("badge")}
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {t("title1")}
                <br />
                <span className="text-primary">{t("title1Highlight")}</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                {t("subtitle")}
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    {t("ctaPrimary")}
                    <Arrow className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg">
                    {t("ctaTrial")}
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="ghost" size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    {t("ctaSecondary")}
                  </Button>
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.4}>
              <p className="mt-10 text-sm text-muted-foreground">
                {t("socialProof")}
              </p>
            </FadeUp>
          </div>

          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 end-0 z-10 rotate-2"
              >
                <DocumentPreviewCard type="receipt_voucher" scale={0.45} />
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="relative z-20 mx-auto"
              >
                <DocumentPreviewCard type="invoice" scale={0.55} />
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 start-0 z-10 -rotate-3"
              >
                <DocumentPreviewCard type="payment_voucher" scale={0.42} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
