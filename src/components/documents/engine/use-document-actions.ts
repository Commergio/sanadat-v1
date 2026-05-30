"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/pdf-export";
import { generateWhatsAppLink } from "@/lib/utils";
import type { DocumentExportConfig, DocumentShareMeta } from "./types";
import { resolveWhatsAppPhone, useDocumentBranding } from "./use-document-branding";

export function useDocumentActions(
  exportConfig: DocumentExportConfig,
  shareMeta: DocumentShareMeta
) {
  const t = useTranslations("documents");
  const company = useDocumentBranding();

  const { previewElementId, pdfFilenamePrefix } = exportConfig;
  const { documentNumber, partyName, amountLabel } = shareMeta;

  const pdfFilename = useMemo(
    () => `${pdfFilenamePrefix}-${documentNumber}`,
    [pdfFilenamePrefix, documentNumber]
  );

  const print = useCallback(() => {
    window.print();
  }, []);

  const exportPdf = useCallback(async () => {
    try {
      await exportToPdf(previewElementId, pdfFilename);
      toast.success(t("pdfSuccess"));
    } catch {
      toast.error(t("pdfFailed"));
    }
  }, [previewElementId, pdfFilename, t]);

  const shareWhatsApp = useCallback(() => {
    const message = t("whatsappMessage", {
      type: shareMeta.documentTitle ?? t("document"),
      number: documentNumber,
      party: partyName || "—",
      amount: amountLabel,
    });
    window.open(generateWhatsAppLink(resolveWhatsAppPhone(company), message), "_blank");
  }, [company, documentNumber, partyName, amountLabel, shareMeta.documentTitle, t]);

  return { print, exportPdf, shareWhatsApp };
}
