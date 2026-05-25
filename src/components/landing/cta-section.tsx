"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isRtlLocale } from "@/i18n/routing";

export function CtaSection() {
  const t = useTranslations("cta");
  const locale = useLocale();
  const Arrow = isRtlLocale(locale) ? ArrowLeft : ArrowRight;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
                {t("subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 bg-white text-primary hover:bg-white/90"
                  >
                    {t("button")}
                    <Arrow className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
