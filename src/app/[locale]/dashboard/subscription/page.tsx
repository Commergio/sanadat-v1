"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { useCompany } from "@/hooks/use-company";
import { formatDate } from "@/lib/format";
import { daysUntil } from "@/lib/utils";
import { useLocale } from "next-intl";

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const { subscription, loading } = useCompany();

  const expiresAt = subscription?.expires_at ?? new Date().toISOString();
  const days = daysUntil(expiresAt);
  const status = subscription?.status ?? "trialing";

  return (
    <>
      <DashboardHeader title={t("title")} />
      <main className="max-w-2xl flex-1 space-y-6 p-4 lg:p-8">
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
          {t("paymentReady")}
        </p>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" />
                {t("status")}
              </CardTitle>
              <Badge variant={status === "active" ? "success" : "secondary"}>
                {loading ? "…" : status === "active" ? t("active") : t("status")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              {t("yearlyAmount")}: {SUBSCRIPTION_PRICE} SAR
            </p>
            <p className="text-muted-foreground">
              {t("expiryDate")}: {formatDate(expiresAt, locale)} ({t("days", { days })})
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
