"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FadeUp } from "@/components/motion/fade-up";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
                ابدأ رقمنة سنداتك اليوم
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
                انضم لمئات المنشآت السعودية التي تثق بنظام السندات لإدارة مستنداتها المالية
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/ar/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 bg-white text-primary hover:bg-white/90"
                  >
                    ابدأ الآن — 399 ر.س/سنة
                    <ArrowLeft className="h-4 w-4" />
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
