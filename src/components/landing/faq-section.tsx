"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp } from "@/components/motion/fade-up";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "هل يمكن تعديل المستند بعد إنشائه؟",
    a: "لا. المستندات غير قابلة للتعديل بعد الإنشاء لضمان الموثوقية. يمكنك فقط إلغاء المستند مع ذكر السبب، ويبقى مرئياً في السجل.",
  },
  {
    q: "ماذا يحدث عند إلغاء المستند؟",
    a: "يُعلَّم المستند كملغى ويبقى في السجل برقمه الأصلي. الأرقام لا تُعاد استخدامها أبداً.",
  },
  {
    q: "هل النظام يدعم الفواتير الضريبية؟",
    a: "النظام مصمم للفواتير غير الضريبية وسندات القبض والصرف. دعم الفواتير الضريبية وامتثال هيئة الزكاة قيد التطوير المستقبلي.",
  },
  {
    q: "كيف يعمل الاشتراك والتجديد؟",
    a: "اشتراك سنوي بـ 399 ر.س مع تجديد تلقائي. تصلك تنبيهات قبل انتهاء الاشتراك بـ 7 و 3 و 1 يوم.",
  },
  {
    q: "ما بوابات الدفع المدعومة؟",
    a: "النظام جاهز للتكامل مع ميسر وهايبر باي وSTC Pay، مع دعم مدى وفيزا وApple Pay.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-surface">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">الأسئلة الشائعة</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            أسئلة متكررة
          </h2>
        </FadeUp>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FadeUp key={i} delay={i * 0.05}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-5 text-right"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      open === i && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
