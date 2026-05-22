"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FadeUp } from "@/components/motion/fade-up";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";

const features = [
  "سندات قبض وصرف غير محدودة",
  "فواتير غير ضريبية",
  "ترقيم تسلسلي آمن",
  "تصدير PDF وطباعة",
  "مشاركة واتساب",
  "لوحة تحكم وتحليلات",
  "دعم فني عبر واتساب",
  "تجديد تلقائي",
];

const paymentIcons = [
  { name: "مدى", label: "Mada" },
  { name: "Visa", label: "Visa" },
  { name: "Apple Pay", label: "Apple Pay" },
  { name: "STC Pay", label: "STC Pay" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">الأسعار</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            باقة واحدة — بسيطة وشفافة
          </h2>
          <p className="mt-4 text-muted-foreground">
            بدون تعقيد — كل المميزات مشمولة
          </p>
        </FadeUp>

        <FadeUp delay={0.1} className="max-w-md mx-auto">
          <Card className="relative overflow-hidden border-primary/20 shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <CardHeader className="text-center pt-10 pb-4">
              <p className="text-sm text-muted-foreground mb-2">الاشتراك السنوي</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">{SUBSCRIPTION_PRICE}</span>
                <span className="text-lg text-muted-foreground">ر.س / سنة</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                تجديد تلقائي — يمكن الإلغاء في أي وقت
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/ar/register" className="block">
                <Button size="lg" className="w-full">
                  ابدأ الاشتراك الآن
                </Button>
              </Link>

              <div className="mt-6 flex items-center justify-center gap-3">
                {paymentIcons.map((icon) => (
                  <div
                    key={icon.name}
                    className="flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-[10px] font-medium text-muted-foreground"
                  >
                    {icon.name}
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-3">
                مدعوم عبر ميسر · هايبر باي · STC Pay
              </p>
            </CardContent>
          </Card>
        </FadeUp>
      </div>
    </section>
  );
}
