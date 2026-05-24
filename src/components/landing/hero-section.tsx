"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion/fade-up";
import { DocumentPreviewCard } from "@/components/documents/document-preview-card";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-950/30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <FadeUp>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                منصة سعودية موثوقة للمنشآت الصغيرة
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                وداعاً للسندات
                <br />
                <span className="text-primary">الورقية</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                إدارة سندات القبض والصرف والفواتير غير الضريبية بطريقة احترافية.
                بسيطة، آمنة، وجاهزة للامتثال المستقبلي — باشتراك سنوي 399 ر.س.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/ar/register">
                  <Button size="lg" className="gap-2">
                    ابدأ الآن
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/ar/dashboard">
                  <Button variant="outline" size="lg">
                    جرّب النظام
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="ghost" size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    شاهد المميزات
                  </Button>
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex -space-x-2 space-x-reverse">
                  {["م", "أ", "س"].map((letter, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-medium text-primary"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <span>+500 منشأة تثق بنظام السندات</span>
              </div>
            </FadeUp>
          </div>

          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 z-10 rotate-2"
              >
                <DocumentPreviewCard type="receipt_voucher" scale={0.45} />
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="relative z-20 mx-auto"
              >
                <DocumentPreviewCard type="invoice" scale={0.55} />
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 z-10 -rotate-3"
              >
                <DocumentPreviewCard type="payment_voucher" scale={0.42} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
