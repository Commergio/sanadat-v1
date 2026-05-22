"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Check, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { mockSubscription } from "@/lib/mock-data";
import { formatDate, daysUntil } from "@/lib/utils";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const sub = mockSubscription;
  const days = daysUntil(sub.expires_at);
  const progress = Math.max(0, Math.min(100, ((365 - days) / 365) * 100));

  const handleRenew = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: "moyasar", amount: SUBSCRIPTION_PRICE }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.info("بوابة الدفع جاهزة — أضف مفاتيح API للتفعيل");
      }
    } catch {
      toast.error("فشل بدء عملية الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardHeader title="الاشتراك" />
      <main className="flex-1 p-4 lg:p-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                حالة الاشتراك
              </CardTitle>
              <Badge variant="success">نشط</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">المدة المتبقية</span>
                <span className="font-medium">{days} يوم</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">تاريخ الانتهاء</span>
                <span>{formatDate(sub.expires_at)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">المبلغ السنوي</span>
                <span className="font-semibold">{SUBSCRIPTION_PRICE} ر.س</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">التجديد التلقائي</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="h-4 w-4" />
                  مفعّل
                </span>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={handleRenew} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "جاري التحويل..." : "تجديد الاشتراك"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              مدعوم: ميسر · هايبر باي · STC Pay · مدى · Visa · Apple Pay
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
