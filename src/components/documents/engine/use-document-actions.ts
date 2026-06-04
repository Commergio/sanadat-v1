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
  const { documentId, documentType, documentNumber, partyName, amountLabel } = shareMeta;

  const logActivity = useCallback(
    async (action: "document.exported" | "document.shared") => {
      if (!documentId || !documentType) return;
      try {
        await fetch("/api/documents/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            entityId: documentId,
            metadata: {
              documentType,
              displayNumber: documentNumber,
            },
          }),
        });
      } catch {
        // best-effort only
      }
    },
    [documentId, documentType, documentNumber]
  );

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
      void logActivity("document.exported");
    } catch {
      toast.error(t("pdfFailed"));
    }
  }, [previewElementId, pdfFilename, t, logActivity]);

  const shareWhatsApp = useCallback(() => {
    const message = t("whatsappMessage", {
      type: shareMeta.documentTitle ?? t("document"),
      number: documentNumber,
      party: partyName || "—",
      amount: amountLabel,
    });
    window.open(generateWhatsAppLink(resolveWhatsAppPhone(company), message), "_blank");
    void logActivity("document.shared");
  }, [company, documentNumber, partyName, amountLabel, shareMeta.documentTitle, t, logActivity]);

  return { print, exportPdf, shareWhatsApp };
}
