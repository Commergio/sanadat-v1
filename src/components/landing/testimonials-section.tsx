"use client";

import { useTranslations } from "next-intl";
import { FadeUp } from "@/components/motion/fade-up";
import { Card, CardContent } from "@/components/ui/card";

const keys = ["1", "2", "3"] as const;

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">{t("label")}</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-3">
          {keys.map((key, i) => (
            <FadeUp key={key} delay={i * 0.1}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                    &ldquo;{t(`items.${key}.text`)}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t(`items.${key}.name`)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`items.${key}.company`)}
                    </p>
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
