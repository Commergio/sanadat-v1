"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminOverviewContent } from "@/components/admin/admin-overview";
import { useTranslations } from "next-intl";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("overview")} description={t("overviewDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminOverviewContent />
      </main>
    </>
  );
}
