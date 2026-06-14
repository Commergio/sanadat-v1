"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CreditCard, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/logo";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("onboarding");
  const ts = useTranslations("settings");
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / 3) * 100;
  const NextChevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden flex flex-col items-center justify-center p-4 sm:p-6 auth-gradient app-safe-bottom">
      <div className="w-full max-w-lg min-w-0">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>
        <Progress value={progress} className="mb-8" />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardContent className="p-5 sm:p-8">
                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">{t("completeCompany")}</h2>
                    <div className="space-y-2">
                      <Label>{ts("companyName")}</Label>
                      <Input />
                    </div>
                    <div className="space-y-2">
                      <Label>{ts("crNumber")}</Label>
                      <Input dir="ltr" className="text-left" />
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="text-center space-y-4">
                    <h2 className="text-xl font-bold">{t("subscribeNow")}</h2>
                    <p className="text-4xl font-bold text-primary">
                      {SUBSCRIPTION_PRICE}{" "}
                      <span className="text-lg">SAR/year</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{t("allFeatures")}</p>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                    <h2 className="text-xl font-bold">{t("allSet")}</h2>
                    <p className="text-sm text-muted-foreground">{t("allSetHint")}</p>
                  </div>
                )}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  {step > 0 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="min-w-[7rem]">
                      {t("prev")}
                    </Button>
                  )}
                  <Button
                    className="ms-auto min-w-[7rem] gap-2"
                    onClick={() =>
                      step < 2 ? setStep(step + 1) : router.push("/dashboard")
                    }
                  >
                    {step === 2 ? t("goDashboard") : t("next")}
                    <NextChevron className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
