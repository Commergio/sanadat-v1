"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminClientsContent } from "@/components/admin/admin-clients";

export default function AdminClientsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("clients")} description={t("clientsDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminClientsContent />
      </main>
    </>
  );
}
