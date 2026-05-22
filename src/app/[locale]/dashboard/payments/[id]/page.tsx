"use client";

import { use } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { A4Document } from "@/components/documents/a4-document";
import { DocumentActions } from "@/components/documents/document-actions";
import { Badge } from "@/components/ui/badge";
import { mockPayment } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function PaymentDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const doc = { ...mockPayment, id };

  return (
    <>
      <DashboardHeader title={doc.display_number} />
      <main className="flex-1 p-4 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Badge variant={doc.status === "active" ? "success" : "destructive"}>
            {doc.status === "active" ? "نشط" : "ملغى"}
          </Badge>
          <DocumentActions
            documentId={doc.id}
            documentNumber={doc.display_number}
            partyName={doc.party_name}
            amount={formatCurrency(doc.amount)}
          />
        </div>
        <div id="document-preview" className="overflow-auto bg-muted/30 rounded-xl p-4 lg:p-8">
          <A4Document document={doc} title="سند صرف" />
        </div>
      </main>
    </>
  );
}
