"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";

export default function CompanySettingsPage() {
  const t = useTranslations("settings.company");

  return (
    <>
      <DashboardHeader title={t("title")} />
      <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8">
        <CompanySettingsForm />
      </main>
    </>
  );
}
