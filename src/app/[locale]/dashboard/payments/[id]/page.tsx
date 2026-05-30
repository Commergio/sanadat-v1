"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentDetailView } from "@/components/documents/engine";
import { Badge } from "@/components/ui/badge";
import { getMockPayment } from "@/lib/mock-data";

export default function PaymentDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const td = useTranslations("dashboard.table");
  const doc = getMockPayment(id);

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
        />
      </main>
    </>
  );
}
