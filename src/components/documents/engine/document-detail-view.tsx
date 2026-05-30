"use client";

import { useLocale, useTranslations } from "next-intl";
import { A4Document } from "@/components/documents/a4-document";
import { formatCurrency } from "@/lib/format";
import type { Invoice, PaymentVoucher, ReceiptVoucher } from "@/lib/types";
import { DocumentActionButtons } from "./document-action-buttons";
import { DocumentPreviewShell } from "./document-preview-shell";
import { getDocumentAmount, getDocumentConfig } from "./registry";
import { DETAIL_PREVIEW_ELEMENT_ID } from "./types";

type ViewableDocument = ReceiptVoucher | PaymentVoucher | Invoice;

interface DocumentDetailViewProps {
  document: ViewableDocument;
  header?: React.ReactNode;
  actionsExtra?: React.ReactNode;
  footer?: React.ReactNode;
}

export function DocumentDetailView({
  document,
  header,
  actionsExtra,
  footer,
}: DocumentDetailViewProps) {
  const locale = useLocale();
  const t = useTranslations("documents");
  const config = getDocumentConfig(document.type);
  const amount = getDocumentAmount(document);

  const exportConfig = {
    previewElementId: DETAIL_PREVIEW_ELEMENT_ID,
    pdfFilenamePrefix: config.pdfFilenamePrefix,
  };

  const shareMeta = {
    documentNumber: document.display_number,
    partyName: document.party_name,
    amountLabel: formatCurrency(amount, locale),
    documentTitle: t(config.titleKey),
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        {header ? <div className="flex flex-wrap items-center gap-2">{header}</div> : null}
        <div className="flex flex-wrap items-center gap-2">
          {actionsExtra}
          <DocumentActionButtons
            exportConfig={exportConfig}
            shareMeta={shareMeta}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <DocumentPreviewShell previewId={DETAIL_PREVIEW_ELEMENT_ID} mode="detail">
        <A4Document document={document} title={t(config.titleKey)} />
      </DocumentPreviewShell>

      {footer}
    </div>
  );
}
