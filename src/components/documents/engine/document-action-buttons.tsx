"use client";

import { Printer, Download, MessageCircle } from "lucide-react";
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
}

export function DocumentActionButtons({
  exportConfig,
  shareMeta,
  compact = false,
  className,
}: DocumentActionButtonsProps) {
  const t = useTranslations("documents");
  const { print, exportPdf, shareWhatsApp } = useDocumentActions(exportConfig, shareMeta);

  const labelClass = compact ? "hidden sm:inline" : undefined;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={print}>
        <Printer className="h-4 w-4" />
        <span className={labelClass}>{t("print")}</span>
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={exportPdf}>
        <Download className="h-4 w-4" />
        <span className={labelClass}>{t("exportPdf")}</span>
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={shareWhatsApp}>
        <MessageCircle className="h-4 w-4" />
        <span className={labelClass}>{t("whatsapp")}</span>
      </Button>
    </div>
  );
}
