"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CreditCard, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/logo";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";

const steps = [
  { title: "بيانات المنشأة", icon: Building2 },
  { title: "الاشتراك", icon: CreditCard },
  { title: "جاهز!", icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 auth-gradient">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo href="/ar" />
        </div>
        <Progress value={progress} className="mb-8" />
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-8">
                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">أكمل بيانات منشأتك</h2>
                    <div className="space-y-2"><Label>اسم المنشأة</Label><Input /></div>
                    <div className="space-y-2"><Label>رقم السجل التجاري</Label><Input dir="ltr" className="text-left" /></div>
                  </div>
                )}
                {step === 1 && (
                  <div className="text-center space-y-4">
                    <h2 className="text-xl font-bold">اشترك الآن</h2>
                    <p className="text-4xl font-bold text-primary">{SUBSCRIPTION_PRICE} <span className="text-lg">ر.س/سنة</span></p>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                    <h2 className="text-xl font-bold">كل شيء جاهز!</h2>
                  </div>
                )}
                <div className="mt-8 flex justify-between">
                  {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>السابق</Button>}
                  <Button className="mr-auto gap-2" onClick={() => step < 2 ? setStep(step + 1) : router.push("/ar/dashboard")}>
                    {step === 2 ? "الذهاب للوحة التحكم" : "التالي"}
                    <ChevronLeft className="h-4 w-4" />
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
