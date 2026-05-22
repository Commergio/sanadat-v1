"use client";

import { FadeUp } from "@/components/motion/fade-up";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "أحمد الشمري",
    company: "مؤسسة الشمري للتجارة",
    text: "وفّر علينا ساعات من العمل الورقي. المستندات تبدو رسمية جداً والعملاء يثقون بها.",
  },
  {
    name: "فاطمة العتيبي",
    company: "مكتب العتيبي المحاسبي",
    text: "أفضل نظام سندات استخدمته. بسيط، سريع، والترقيم التسلسلي يعطينا راحة بال.",
  },
  {
    name: "خالد القحطاني",
    company: "شركة النخبة للمقاولات",
    text: "الفواتير وسندات القبض مرتبطة ببعض — هذا بالضبط ما نحتاجه كمقاولين.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">آراء العملاء</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            يثق بنا أصحاب المنشآت
          </h2>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.company}</p>
                  </div>
                </CardContent>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
