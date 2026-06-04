"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { SubscriptionBillingPanel } from "@/components/subscription/subscription-billing-panel";

export default function SubscriptionPage() {
  const t = useTranslations("subscription");

  return (
    <>
      <DashboardHeader title={t("title")} />
      <main className="max-w-3xl flex-1 space-y-6 p-4 lg:p-8">
        <SubscriptionBillingPanel />
      </main>
    </>
  );
}
