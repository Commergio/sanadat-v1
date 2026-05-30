"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isRtlLocale } from "@/i18n/routing";
import { IS_DEMO_MODE } from "@/lib/constants";

export function CtaSection() {
  const t = useTranslations("cta");
  const th = useTranslations("hero");
  const locale = useLocale();
  const Arrow = isRtlLocale(locale) ? ArrowLeft : ArrowRight;

  return (
    <section className="landing-section pt-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-primary/25 sm:px-16 lg:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-[2.5rem]">
                {t("title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
                {t("subtitle")}
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href={IS_DEMO_MODE ? "/login" : "/register"}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 gap-2 bg-white px-8 text-base text-primary shadow-xl hover:bg-white/95 sm:h-14"
                  >
                    {IS_DEMO_MODE ? th("ctaDemoLogin") : t("button")}
                    <Arrow className="h-4 w-4" />
                  </Button>
                </Link>
                {IS_DEMO_MODE && (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 border-white/30 bg-white/10 px-8 text-base text-white hover:bg-white/20 sm:h-14"
                    >
                      {th("ctaDemoExplore")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
