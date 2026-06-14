"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminStaffContent } from "@/components/admin/admin-staff";
import { useTranslations } from "next-intl";

export default function AdminStaffPage() {
  const t = useTranslations("admin.staff");

  return (
    <>
      <AdminHeader title={t("pageTitle")} description={t("pageDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminStaffContent />
      </main>
    </>
  );
}
