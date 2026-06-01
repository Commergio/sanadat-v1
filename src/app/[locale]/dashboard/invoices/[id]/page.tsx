"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("dashboard");

  return (
    <>
      <DashboardHeader title={id} />
      <main className="flex-1 p-4 lg:p-8">
        <EmptyState
          title={t("emptyDocsTitle")}
          description={t("emptyDocsDesc")}
          variant="documents"
          actionLabel={t("invoices")}
          actionHref="/dashboard/invoices"
        />
      </main>
    </>
  );
}
