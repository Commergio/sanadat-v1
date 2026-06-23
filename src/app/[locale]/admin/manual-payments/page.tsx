"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminManualPaymentsContent } from "@/components/admin/admin-manual-payments";

export default function AdminManualPaymentsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader
        title={t("manualPaymentsNav")}
        description={t("manualPaymentsDesc")}
      />
      <main className="flex-1 p-4 lg:p-8">
        <AdminManualPaymentsContent />
      </main>
    </>
  );
}
