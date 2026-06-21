"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReceiptVoucher } from "@/lib/types";
import {
  canExportReceipt,
  effectiveReceiptLifecycle,
  receiptDisplayNumber,
} from "@/lib/documents/receipt-lifecycle";
import { DocumentDetailView } from "@/components/documents/engine";
import { ReceiptApprovalPanel } from "@/components/documents/receipt-approval-panel";
import { CancelDocumentButton } from "@/components/documents/engine/cancel-document-button";
import { ReceiptLifecycleBadge } from "@/components/documents/receipt-approval-panel";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

interface ReceiptDetailClientProps {
  document: ReceiptVoucher;
  customerSignatureUrl: string | null;
  canCancel: boolean;
  canSendApproval: boolean;
}

export function ReceiptDetailClient({
  document,
  customerSignatureUrl,
  canCancel,
  canSendApproval,
}: ReceiptDetailClientProps) {
  const locale = useLocale();
  const td = useTranslations("dashboard.table");
  const tDash = useTranslations("dashboard");
  const tDocs = useTranslations("documents");
  const lifecycle = effectiveReceiptLifecycle(document.lifecycle_status);
  const exportEnabled = canExportReceipt(lifecycle, document.display_number);
  const pendingApproval = lifecycle === "pending_approval";
  const isDraft = lifecycle === "draft";
  const isRejected = lifecycle === "rejected";

  const displayNumber = receiptDisplayNumber(document.display_number, lifecycle);
  const titleNumber = document.display_number || displayNumber;

  const showCancel =
    canCancel &&
    document.status === "active" &&
    (lifecycle === "pending_approval" || lifecycle === "draft" || lifecycle === "rejected");

  const header = (
    <>
      <Badge variant={document.status === "active" ? "success" : "destructive"}>
        {document.status === "active" ? td("active") : td("cancelled")}
      </Badge>
      <ReceiptLifecycleBadge lifecycle={lifecycle} />
    </>
  );

  const docForPreview: ReceiptVoucher = {
    ...document,
    lifecycle_status: lifecycle,
    display_number: titleNumber === "—" ? "" : titleNumber,
  };

  return (
    <DocumentDetailView
      document={docForPreview}
      exportEnabled={exportEnabled}
      pendingApprovalWatermark={pendingApproval}
      showDraftWatermark={isDraft || isRejected}
      header={header}
      actionsExtra={
        showCancel ? (
          <CancelDocumentButton endpoint={`/api/receipts/${document.id}/cancel`} />
        ) : null
      }
      footer={
        <>
          <ReceiptApprovalPanel receipt={document} canSendApproval={canSendApproval} />
          {lifecycle === "issued" ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{tDocs("approvedCustomerSignature")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {customerSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customerSignatureUrl}
                    alt={tDocs("approvedCustomerSignature")}
                    className="max-h-28 max-w-full object-contain rounded border bg-white p-2"
                  />
                ) : (
                  <p className="text-muted-foreground">{tDocs("noSavedSignature")}</p>
                )}
                {document.approved_by_name ? (
                  <p>
                    {tDocs("signatureNameLabel")} {document.approved_by_name}
                  </p>
                ) : null}
                {document.approved_by_phone ? (
                  <p dir="ltr" className="text-start">
                    {tDocs("signaturePhoneLabel")} {document.approved_by_phone}
                  </p>
                ) : null}
                {document.approved_at ? (
                  <p>{tDocs("signatureDateLabel")} {formatDate(document.approved_at, locale)}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          {isRejected ? (
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/receipts/new">{tDash("newReceipt")}</Link>
              </Button>
            </div>
          ) : null}
        </>
      }
      shareMetaOverride={{
        documentNumber: document.display_number || (locale === "ar" ? "مسودة" : "Draft"),
        amountLabel: formatCurrency(document.amount, locale),
        lifecycleStatus: lifecycle,
      }}
      receiptApproval={{
        lifecycleStatus: lifecycle,
        signatureUrl: customerSignatureUrl,
        approvedByName: document.approved_by_name ?? null,
        approvedByPhone: document.approved_by_phone ?? null,
        approvedAt: document.approved_at ?? null,
      }}
    />
  );
}
