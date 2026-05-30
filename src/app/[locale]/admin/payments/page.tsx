"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPaymentsContent } from "@/components/admin/admin-payments";

export default function AdminPaymentsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("payments")} description={t("paymentsDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminPaymentsContent />
      </main>
    </>
  );
}
