"use client";

import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { A4Document } from "@/components/documents/a4-document";
import { DocumentActions } from "@/components/documents/document-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockInvoice } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { ArrowDownLeft } from "lucide-react";

export default function InvoiceDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("documents");
  const td = useTranslations("dashboard");
  const tt = useTranslations("dashboard.table");
  const doc = { ...mockInvoice, id };

  return (
    <>
      <DashboardHeader title={doc.display_number} />
      <main className="flex-1 p-4 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={doc.status === "active" ? "success" : "destructive"}>
              {doc.status === "active" ? tt("active") : tt("cancelled")}
            </Badge>
            <Badge variant={doc.payment_status === "paid" ? "success" : "warning"}>
              {doc.payment_status === "paid" ? td("invoiceTable.paid") : td("invoiceTable.unpaid")}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {doc.payment_status !== "paid" && (
              <Link href={`/dashboard/receipts/new?invoice=${doc.id}`}>
                <Button size="sm" className="gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  {td("issueReceipt")}
                </Button>
              </Link>
            )}
            <DocumentActions
              documentId={doc.id}
              documentNumber={doc.display_number}
              partyName={doc.party_name}
              amount={formatCurrency(doc.total, locale)}
            />
          </div>
        </div>

        <div id="document-preview" className="overflow-auto bg-muted/30 rounded-xl p-4 lg:p-8">
          <A4Document document={doc} title={t("invoice")} />
        </div>
      </main>
    </>
  );
}
