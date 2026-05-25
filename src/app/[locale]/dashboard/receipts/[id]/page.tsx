"use client";

import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { A4Document } from "@/components/documents/a4-document";
import { DocumentActions } from "@/components/documents/document-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockReceipt } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("documents");
  const td = useTranslations("dashboard.table");
  const doc = { ...mockReceipt, id };

  return (
    <>
      <DashboardHeader title={doc.display_number} />
      <main className="flex-1 p-4 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant={doc.status === "active" ? "success" : "destructive"}>
              {doc.status === "active" ? td("active") : td("cancelled")}
            </Badge>
          </div>
          <DocumentActions
            documentId={doc.id}
            documentNumber={doc.display_number}
            partyName={doc.party_name}
            amount={formatCurrency(doc.amount, locale)}
          />
        </div>

        <div id="document-preview" className="overflow-auto bg-muted/30 rounded-xl p-4 lg:p-8">
          <A4Document document={doc} title={t("receipt")} />
        </div>

        {doc.status === "active" && (
          <Button variant="destructive" size="sm">
            {t("cancelDoc")}
          </Button>
        )}
      </main>
    </>
  );
}
