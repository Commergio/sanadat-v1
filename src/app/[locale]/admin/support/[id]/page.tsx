"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSupportDetailContent } from "@/components/admin/admin-support-detail";

export default function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("admin.support");

  return (
    <>
      <AdminHeader title={t("detailTitle")} description={t("detailDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminSupportDetailContent ticketId={id} />
      </main>
    </>
  );
}
