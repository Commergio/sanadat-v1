"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentDetailView } from "@/components/documents/engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockInvoice } from "@/lib/mock-data";
import { ArrowDownLeft } from "lucide-react";

export default function InvoiceDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const td = useTranslations("dashboard");
  const tt = useTranslations("dashboard.table");
  const doc = getMockInvoice(id);

  return (
    <>
      <DashboardHeader title={doc.display_number} />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <DocumentDetailView
          document={doc}
          header={
            <div className="flex items-center gap-2">
              <Badge variant={doc.status === "active" ? "success" : "destructive"}>
                {doc.status === "active" ? tt("active") : tt("cancelled")}
              </Badge>
              <Badge variant={doc.payment_status === "paid" ? "success" : "warning"}>
                {doc.payment_status === "paid"
                  ? td("invoiceTable.paid")
                  : td("invoiceTable.unpaid")}
              </Badge>
            </div>
          }
          actionsExtra={
            doc.payment_status !== "paid" ? (
              <Link href={`/dashboard/receipts/new?invoice=${doc.id}`}>
                <Button size="sm" className="gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  {td("issueReceipt")}
                </Button>
              </Link>
            ) : undefined
          }
        />
      </main>
    </>
  );
}
