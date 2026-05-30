"use client";

import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";
import { A4Document } from "@/components/documents/a4-document";
import { ResponsiveA4Scale } from "@/components/documents/responsive-a4-scale";
import { mockReceipt } from "@/lib/mock-data";

export function ShowcaseSection() {
  const t = useTranslations("showcase");
  const tDoc = useTranslations("documents");

  return (
    <section id="showcase" className="landing-section overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <SectionHeader label={t("label")} title={t("title")} subtitle={t("subtitle")} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="relative mx-auto max-w-3xl">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent" />
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-8 lg:p-10">
              <ResponsiveA4Scale maxScale={0.72} padding={0}>
                <div className="hero-paper rounded-sm">
                  <A4Document document={mockReceipt} title={tDoc("receipt")} />
                </div>
              </ResponsiveA4Scale>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/80 to-transparent sm:h-24" />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
