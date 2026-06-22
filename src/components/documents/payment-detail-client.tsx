"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PaymentVoucher } from "@/lib/types";
import {
  canExportPayment,
  effectivePaymentLifecycle,
  paymentDisplayNumber,
} from "@/lib/documents/payment-lifecycle";
import { DocumentDetailView } from "@/components/documents/engine";
import { PaymentApprovalPanel } from "@/components/documents/payment-approval-panel";
import { CancelDocumentButton } from "@/components/documents/engine/cancel-document-button";
import { ReceiptLifecycleBadge } from "@/components/documents/receipt-approval-panel";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentDetailClientProps {
  document: PaymentVoucher;
  customerSignatureUrl: string | null;
  canCancel: boolean;
  canSendApproval: boolean;
}

export function PaymentDetailClient({
  document,
  customerSignatureUrl,
  canCancel,
  canSendApproval,
}: PaymentDetailClientProps) {
  const locale = useLocale();
  const td = useTranslations("dashboard.table");
  const tDash = useTranslations("dashboard");
  const tDocs = useTranslations("documents");
  const lifecycle = effectivePaymentLifecycle(document.lifecycle_status);
  const exportEnabled = canExportPayment(lifecycle, document.display_number, document.status);
  const pendingApproval = lifecycle === "pending_approval";
  const isDraft = lifecycle === "draft";
  const isRejected = lifecycle === "rejected";

  const displayNumber = paymentDisplayNumber(document.display_number, lifecycle);
  const titleNumber = document.display_number || displayNumber;

  const showCancel =
    canCancel &&
    document.status === "active" &&
    (lifecycle === "pending_approval" ||
      lifecycle === "draft" ||
      lifecycle === "rejected" ||
      lifecycle === "issued");

  const header = (
    <>
      <Badge variant={document.status === "active" ? "success" : "destructive"}>
        {document.status === "active" ? td("active") : td("cancelled")}
      </Badge>
      <ReceiptLifecycleBadge lifecycle={lifecycle} />
    </>
  );

  const docForPreview: PaymentVoucher = {
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
          <CancelDocumentButton endpoint={`/api/payment-vouchers/${document.id}/cancel`} />
        ) : null
      }
      footer={
        <>
          <PaymentApprovalPanel payment={document} canSendApproval={canSendApproval} />
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
                <Link href="/dashboard/payments/new">{tDash("newPayment")}</Link>
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
