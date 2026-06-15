"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReceiptVoucher } from "@/lib/types";
import { canExportReceipt, receiptDisplayNumber } from "@/lib/documents/receipt-lifecycle";
import { DocumentDetailView } from "@/components/documents/engine";
import { ReceiptApprovalPanel } from "@/components/documents/receipt-approval-panel";
import { CancelDocumentButton } from "@/components/documents/engine/cancel-document-button";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface ReceiptDetailClientProps {
  document: ReceiptVoucher;
  canCancel: boolean;
  canSendApproval: boolean;
}

export function ReceiptDetailClient({
  document,
  canCancel,
  canSendApproval,
}: ReceiptDetailClientProps) {
  const locale = useLocale();
  const td = useTranslations("dashboard.table");
  const lifecycle = document.lifecycle_status ?? "issued";
  const exportEnabled = canExportReceipt(lifecycle, document.status);
  const pendingApproval = lifecycle === "pending_approval";
  const isDraft = lifecycle === "draft" || pendingApproval || lifecycle === "rejected";

  const displayNumber = receiptDisplayNumber(document.display_number, lifecycle);
  const titleNumber = document.display_number || displayNumber;

  const header = (
    <>
      <Badge variant={document.status === "active" ? "success" : "destructive"}>
        {document.status === "active" ? td("active") : td("cancelled")}
      </Badge>
    </>
  );

  const docForPreview: ReceiptVoucher = {
    ...document,
    display_number: titleNumber === "—" ? "" : titleNumber,
  };

  return (
    <DocumentDetailView
      document={docForPreview}
      exportEnabled={exportEnabled}
      pendingApprovalWatermark={pendingApproval}
      showDraftWatermark={isDraft && lifecycle !== "pending_approval"}
      header={header}
      actionsExtra={
        canCancel && document.status === "active" ? (
          <CancelDocumentButton endpoint={`/api/receipts/${document.id}/cancel`} />
        ) : null
      }
      footer={
        <ReceiptApprovalPanel receipt={document} canSendApproval={canSendApproval} />
      }
      shareMetaOverride={{
        documentNumber: document.display_number || tPlaceholder(locale),
        amountLabel: formatCurrency(document.amount, locale),
      }}
    />
  );
}

function tPlaceholder(locale: string): string {
  return locale === "ar" ? "مسودة" : "Draft";
}
