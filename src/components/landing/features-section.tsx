"use client";

import {
  FileText,
  Shield,
  Hash,
  Smartphone,
  Printer,
  Building2,
} from "lucide-react";
import { FadeUp } from "@/components/motion/fade-up";

const features = [
  {
    icon: FileText,
    title: "ثلاثة أنواع مستندات",
    description:
      "سندات قبض، سندات صرف، وفواتير غير ضريبية — كلها في منصة واحدة بتصميم رسمي.",
  },
  {
    icon: Hash,
    title: "ترقيم تسلسلي آمن",
    description:
      "أرقام مستندات فريدة لا تُعاد استخدامها أبداً. المستندات غير قابلة للتعديل بعد الإنشاء.",
  },
  {
    icon: Shield,
    title: "موثوقية قانونية",
    description:
      "تصميم حكومي جاهز للطباعة مع مناطق التوقيع والختم وQR للامتثال المستقبلي.",
  },
  {
    icon: Printer,
    title: "تصدير PDF وطباعة",
    description:
      "مستندات A4 احترافية بتنسيق عربي RTL مع إمكانية الطباعة والمشاركة عبر واتساب.",
  },
  {
    icon: Smartphone,
    title: "متجاوب بالكامل",
    description:
      "يعمل بسلاسة على الجوال والحاسوب — واجهة عربية RTL مصممة للسوق السعودي.",
  },
  {
    icon: Building2,
    title: "جاهز للتوسع",
    description:
      "بنية قابلة للتكامل مع بوابات الدفع ووزارة التجارة مستقبلاً.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">المميزات</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            كل ما تحتاجه منشأتك
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            نظام بسيط وقوي يركز على المستندات الأساسية التي تحتاجها المنشآت الصغيرة يومياً
          </p>
        </FadeUp>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeUp key={feature.title} delay={i * 0.08}>
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
