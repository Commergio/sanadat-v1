"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CreditCard, Check, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { mockSubscription } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { daysUntil } from "@/lib/utils";

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const locale = useLocale();
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
        body: JSON.stringify({ gateway: "moyasar", amount: SUBSCRIPTION_PRICE, locale }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.info(t("paymentReady"));
      }
    } catch {
      toast.error(t("paymentFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardHeader title={t("title")} />
      <main className="flex-1 p-4 lg:p-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t("status")}
              </CardTitle>
              <Badge variant="success">{t("active")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t("remaining")}</span>
                <span className="font-medium">{t("days", { days })}</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t("expiryDate")}</span>
                <span>{formatDate(sub.expires_at, locale)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t("yearlyAmount")}</span>
                <span className="font-semibold">
                  {SUBSCRIPTION_PRICE} {locale === "ar" ? "ر.س" : "SAR"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{t("autoRenew")}</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="h-4 w-4" />
                  {t("enabled")}
                </span>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={handleRenew} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? t("renewing") : t("renew")}
            </Button>

            <p className="text-xs text-center text-muted-foreground">{t("gateways")}</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
