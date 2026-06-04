"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSupportContent } from "@/components/admin/admin-support";
import { useTranslations } from "next-intl";

export default function AdminSupportPage() {
  const t = useTranslations("admin.support");

  return (
    <>
      <AdminHeader title={t("pageTitle")} description={t("pageDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminSupportContent />
      </main>
    </>
  );
}
