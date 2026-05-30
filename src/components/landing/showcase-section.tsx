"use client";

import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";
import { A4Document } from "@/components/documents/a4-document";
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
            <div
              className="relative mx-auto overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-6 sm:p-10"
              style={{ maxHeight: 480 }}
            >
              <div
                className="mx-auto origin-top transform scale-[0.55] sm:scale-[0.65]"
                style={{ height: 420 }}
              >
                <div className="hero-paper rounded-sm">
                  <A4Document document={mockReceipt} title={tDoc("receipt")} />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-muted/80 to-transparent" />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
