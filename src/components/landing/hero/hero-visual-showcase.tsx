"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FileCheck2, Hash, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format";
import { mockPayment } from "@/lib/mock-data";
import { HeroA4Invoice } from "./hero-a4-invoice";
import { HeroReceiptCard } from "./hero-receipt-card";
import { HeroAnalyticsCard } from "./hero-analytics-card";
import { cn } from "@/lib/utils";

const floatA = {
  y: [0, -10, 0],
  transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" as const },
};

const floatB = {
  y: [0, 8, 0],
  transition: { duration: 4.8, repeat: Infinity, ease: "easeInOut" as const, delay: 0.6 },
};

export function HeroVisualShowcase({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("hero.visual");
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { stiffness: 120, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), spring);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), spring);

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[520px] lg:max-w-none", className)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/4 end-0 h-48 w-48 rounded-full bg-emerald-400/15 blur-[80px]" />
      </div>

      <div className="hero-grid-bg pointer-events-none absolute inset-0 -z-10 opacity-60" />

      {/* Trust chips — compact on showcase only */}
      <motion.div
        className="mb-3 flex flex-wrap justify-center gap-1.5 lg:absolute lg:-top-1 lg:start-0 lg:z-30 lg:mb-0 lg:justify-start"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        {[
          { icon: Printer, label: t("printReady") },
          { icon: Hash, label: t("sequential") },
          { icon: FileCheck2, label: t("verified") },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="hero-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </span>
        ))}
      </motion.div>

      <div className="relative min-h-[420px] sm:min-h-[460px] lg:min-h-[500px]">
        {/* Analytics — top corner */}
        <motion.div
          className="absolute top-0 end-0 z-20 lg:-top-4 lg:end-4"
          animate={floatB}
        >
          <HeroAnalyticsCard />
        </motion.div>

        {/* Central A4 invoice */}
        <motion.div
          className="absolute top-[52%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
          style={{ rotateX, rotateY, perspective: 1200 }}
          initial={{ opacity: 0, scale: 0.88, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <motion.div animate={floatA}>
            <HeroA4Invoice className="relative" />
            {/* Ground shadow */}
            <div
              className="pointer-events-none absolute -bottom-8 left-1/2 h-8 w-[85%] -translate-x-1/2 rounded-[100%] bg-slate-900/15 blur-xl"
              aria-hidden
            />
          </motion.div>
        </motion.div>

        {/* Receipt card — bottom start */}
        <motion.div
          className="absolute bottom-2 start-0 z-20 lg:bottom-8 lg:-start-6"
          animate={floatB}
        >
          <HeroReceiptCard />
        </motion.div>

        {/* Payment voucher accent strip */}
        <motion.div
          className="absolute bottom-24 end-0 z-0 hidden sm:block lg:end-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="hero-glass rounded-xl px-3 py-2 text-[10px]">
            <p className="font-medium text-muted-foreground">{mockPayment.display_number}</p>
            <p className="font-bold text-amber-600 tabular-nums">
              − {formatCurrency(mockPayment.amount, locale)}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
