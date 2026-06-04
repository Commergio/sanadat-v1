"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { TenantSupportContent } from "@/components/support/tenant-support";

export default function DashboardSupportPage() {
  const t = useTranslations("dashboard.support");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <main className="max-w-3xl flex-1 p-4 lg:p-8">
        <TenantSupportContent />
      </main>
    </>
  );
}
