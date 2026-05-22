"use client";

import { FadeUp } from "@/components/motion/fade-up";
import { A4Document } from "@/components/documents/a4-document";
import { mockReceipt } from "@/lib/mock-data";

export function ShowcaseSection() {
  return (
    <section id="showcase" className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">معاينة المستندات</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            مستندات رسمية جاهزة للطباعة
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            تصميم A4 احترافي بتنسيق عربي — مناسب للطباعة والأرشفة الرسمية
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="transform scale-[0.65] sm:scale-75 origin-top mx-auto" style={{ height: 400 }}>
              <A4Document document={mockReceipt} title="سند قبض" />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
