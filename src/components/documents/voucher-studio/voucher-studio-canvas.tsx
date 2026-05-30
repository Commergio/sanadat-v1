"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { A4Document } from "@/components/documents/a4-document";
import {
  buildVoucherPreview,
  DocumentPreviewShell,
} from "@/components/documents/engine";
import { useVoucherStudio } from "@/components/documents/voucher-studio/voucher-studio-context";
import { cn } from "@/lib/utils";

export function VoucherStudioCanvas() {
  const t = useTranslations("documents");
  const { config, displayNum, number, watch } = useVoucherStudio();
  const values = watch();
  const { labels, theme, previewElementId } = config;

  const previewDoc = useMemo(
    () =>
      buildVoucherPreview({
        documentType: config.type,
        number,
        displayNumber: displayNum,
        date: values.date,
        amount: values.amount,
        party_name: values.party_name,
        description: values.description,
        payment_method: values.payment_method,
        transfer_number: values.transfer_number,
        bank_name: values.bank_name,
        transfer_date: values.transfer_date,
        reference_number: values.reference_number,
      }),
    [config.type, values, number, displayNum]
  );

  return (
    <div className="studio-canvas order-1 flex min-h-[280px] flex-col md:min-h-0 md:sticky md:top-0 md:h-[calc(100vh-7.25rem)]">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                theme.liveDotPing
              )}
            />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", theme.liveDot)} />
          </span>
          {t("livePreview")}
        </span>
        <span className="rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          A4 · {t(labels.documentTitle)}
        </span>
      </div>

      <div className="document-studio-preview flex flex-1 items-start justify-center overflow-hidden p-3 sm:p-4 lg:p-6">
        <DocumentPreviewShell previewId={previewElementId} mode="studio">
          <A4Document
            document={previewDoc}
            title={t(labels.documentTitle)}
            notes={values.notes}
            draft
            partyFieldLabel={t(labels.partyLabel)}
            previewPartyPlaceholder={t(labels.previewPartyPlaceholder)}
          />
        </DocumentPreviewShell>
      </div>
    </div>
  );
}
