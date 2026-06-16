"use client";

import { Printer, Download, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentExportConfig, DocumentShareMeta } from "./types";
import { useDocumentActions } from "./use-document-actions";

interface DocumentActionButtonsProps {
  exportConfig: DocumentExportConfig;
  shareMeta: DocumentShareMeta;
  /** Hide button labels on small screens (studio toolbar). */
  compact?: boolean;
  className?: string;
  /** When true, hide all export/print/WhatsApp actions (e.g. receipt studio). */
  hideExportActions?: boolean;
}

export function DocumentActionButtons({
  exportConfig,
  shareMeta,
  compact = false,
  className,
  hideExportActions = false,
}: DocumentActionButtonsProps) {
  const t = useTranslations("documents");
  const tApproval = useTranslations("receiptApproval");
  const { print, exportPdf, shareWhatsApp, exportEnabled, whatsAppMode, exportDisabledTitle } =
    useDocumentActions(exportConfig, shareMeta);

  if (hideExportActions) return null;

  const labelClass = compact ? "hidden sm:inline" : undefined;
  const disabledTitle = exportDisabledTitle;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={print}
        disabled={!exportEnabled}
        title={!exportEnabled ? disabledTitle : undefined}
      >
        <Printer className="h-4 w-4" />
        <span className={labelClass}>{t("print")}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={exportPdf}
        disabled={!exportEnabled}
        title={!exportEnabled ? disabledTitle : undefined}
      >
        <Download className="h-4 w-4" />
        <span className={labelClass}>{t("exportPdf")}</span>
      </Button>
      {whatsAppMode !== "none" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={shareWhatsApp}
        >
          {whatsAppMode === "approval" ? (
            <Send className="h-4 w-4" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          <span className={labelClass}>
            {whatsAppMode === "approval" ? tApproval("sendForApproval") : t("whatsapp")}
          </span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled
          title={disabledTitle}
        >
          <MessageCircle className="h-4 w-4" />
          <span className={labelClass}>{t("whatsapp")}</span>
        </Button>
      )}
    </div>
  );
}
