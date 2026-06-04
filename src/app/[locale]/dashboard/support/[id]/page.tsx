"use client";

import { useTranslations } from "next-intl";
import { use } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { TenantSupportDetailContent } from "@/components/support/tenant-support-detail";

export default function DashboardSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("dashboard.support");

  return (
    <>
      <DashboardHeader title={t("detailTitle")} />
      <main className="flex-1 p-4 lg:p-8">
        <TenantSupportDetailContent ticketId={id} />
      </main>
    </>
  );
}
