"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentDetailView } from "@/components/documents/engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockReceipt } from "@/lib/mock-data";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("documents");
  const td = useTranslations("dashboard.table");
  const doc = getMockReceipt(id);

  return (
    <>
      <DashboardHeader title={doc.display_number} />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <DocumentDetailView
          document={doc}
          header={
            <Badge variant={doc.status === "active" ? "success" : "destructive"}>
              {doc.status === "active" ? td("active") : td("cancelled")}
            </Badge>
          }
          footer={
            doc.status === "active" ? (
              <Button variant="destructive" size="sm">
                {t("cancelDoc")}
              </Button>
            ) : undefined
          }
        />
      </main>
    </>
  );
}
