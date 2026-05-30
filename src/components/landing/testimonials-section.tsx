"use client";

import { Star, Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/motion/fade-up";
import { SectionHeader } from "@/components/landing/section-header";

const keys = ["1", "2", "3"] as const;

const avatarColors = [
  "from-primary to-indigo-600",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <section className="landing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <SectionHeader label={t("label")} title={t("title")} />
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {keys.map((key, i) => (
            <FadeUp key={key} delay={i * 0.1}>
              <motion.article
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-8 shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/5"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <Quote className="absolute top-6 end-6 h-8 w-8 text-primary/10" />

                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t(`items.${key}.text`)}&rdquo;
                </p>

                <div className="mt-8 flex items-center gap-4 border-t border-border/60 pt-6">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-md ${avatarColors[i]}`}
                  >
                    {getInitials(t(`items.${key}.name`))}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {t(`items.${key}.name`)}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {t(`items.${key}.role`)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t(`items.${key}.company`)} · {t(`items.${key}.city`)}
                    </p>
                  </div>
                </div>
              </motion.article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
