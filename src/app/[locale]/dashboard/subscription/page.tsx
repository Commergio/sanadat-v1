"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { SubscriptionBillingPanel } from "@/components/subscription/subscription-billing-panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionPage() {
  const t = useTranslations("subscription");

  return (
    <>
      <DashboardHeader title={t("title")} />
      <main className="min-w-0 max-w-3xl flex-1 space-y-6 p-4 lg:p-8">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <SubscriptionBillingPanel />
        </Suspense>
      </main>
    </>
  );
}
