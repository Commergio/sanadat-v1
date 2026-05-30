"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Maximize2 } from "lucide-react";
import { A4Document } from "@/components/documents/a4-document";
import {
  buildVoucherPreview,
  DocumentPreviewShell,
} from "@/components/documents/engine";
import { Button } from "@/components/ui/button";
import { useVoucherStudio } from "@/components/documents/voucher-studio/voucher-studio-context";
import { cn } from "@/lib/utils";

export function VoucherStudioCanvas() {
  const t = useTranslations("documents");
  const { config, displayNum, number, watch, viewMode, setViewMode } = useVoucherStudio();
  const values = watch();
  const { labels, theme, previewElementId } = config;
  const isFullPreview = viewMode === "preview";

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
    <div
      className={cn(
        "studio-canvas order-1 flex flex-col",
        isFullPreview
          ? "min-h-0 flex-1"
          : "min-h-[280px] md:min-h-0 md:sticky md:top-0 md:h-[calc(100vh-7.25rem)]"
      )}
    >
      <div className="studio-canvas-chrome no-print flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
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
          {isFullPreview ? t("fullPreview") : t("livePreview")}
        </span>
        <div className="flex items-center gap-2">
          {!isFullPreview ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs md:hidden"
              onClick={() => setViewMode("preview")}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {t("fullPreviewShort")}
            </Button>
          ) : null}
          <span className="rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            A4 · {t(labels.documentTitle)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "document-studio-preview flex flex-1 overflow-hidden p-3 sm:p-4 lg:p-6",
          isFullPreview
            ? "items-center justify-center bg-muted/30"
            : "items-start justify-center"
        )}
      >
        <DocumentPreviewShell
          previewId={previewElementId}
          mode="studio"
          studioVariant={isFullPreview ? "full" : "default"}
          className={isFullPreview ? "w-full max-w-[210mm]" : undefined}
        >
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
