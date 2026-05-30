"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSettingsContent } from "@/components/admin/admin-settings";

export default function AdminSettingsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("settings")} description={t("settingsDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminSettingsContent />
      </main>
    </>
  );
}
