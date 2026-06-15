"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { CustomersPanel } from "@/components/dashboard/customers-panel";

export default function CustomersPage() {
  const t = useTranslations("dashboard.customers");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <main className="flex-1 min-w-0 p-4 pb-24 app-safe-bottom lg:p-8 lg:pb-8">
        <CustomersPanel />
      </main>
    </>
  );
}
