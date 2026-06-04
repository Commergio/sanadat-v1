"use client";

import { use } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import { useTranslations } from "next-intl";

export default function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("companyDetail")} description={t("companyDetailDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminCompanyDetail companyId={id} />
      </main>
    </>
  );
}
