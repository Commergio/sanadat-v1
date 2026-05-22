"use client";

import { FadeUp } from "@/components/motion/fade-up";

const steps = [
  {
    step: "01",
    title: "أنشئ حسابك",
    description: "سجّل منشأتك في دقائق وأكمل ملف الشركة مع الشعار والبيانات الرسمية.",
  },
  {
    step: "02",
    title: "اشترك سنوياً",
    description: "ادفع 399 ر.س عبر بوابات الدفع السعودية (مدى، فيزا، Apple Pay، STC Pay).",
  },
  {
    step: "03",
    title: "أصدر مستنداتك",
    description: "أنشئ سندات القبض والصرف والفواتير بترقيم تلقائي وتصميم رسمي جاهز للطباعة.",
  },
  {
    step: "04",
    title: "شارك واطبع",
    description: "صدّر PDF، اطبع، أو شارك عبر واتساب — مع سجل كامل لكل العمليات.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">كيف يعمل</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            أربع خطوات للبدء
          </h2>
        </FadeUp>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <FadeUp key={step.step} delay={i * 0.1}>
              <div className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -left-4 w-8 h-[1px] bg-border" />
                )}
                <div className="text-4xl font-bold text-primary/20 mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
