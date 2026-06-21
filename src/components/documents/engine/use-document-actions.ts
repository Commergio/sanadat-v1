"use client";

import { useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/pdf-export";
import { generateWhatsAppLink } from "@/lib/utils";
import {
  canSendReceiptApprovalWhatsApp,
  isReceiptIssued,
} from "@/lib/documents/receipt-lifecycle";
import {
  canSendPaymentApprovalWhatsApp,
  isPaymentIssued,
} from "@/lib/documents/payment-lifecycle";
import {
  canSendInvoiceApprovalWhatsApp,
  isInvoiceIssued,
} from "@/lib/documents/invoice-lifecycle";
import type { DocumentExportConfig, DocumentShareMeta } from "./types";
import { resolveWhatsAppPhone, useDocumentBranding } from "./use-document-branding";

export type DocumentWhatsAppMode = "final" | "approval" | "none";

export function resolveDocumentWhatsAppMode(shareMeta: DocumentShareMeta): DocumentWhatsAppMode {
  if (shareMeta.exportEnabled !== false) return "final";
  if (
    shareMeta.documentType === "receipt_voucher" &&
    canSendReceiptApprovalWhatsApp(shareMeta.lifecycleStatus)
  ) {
    return "approval";
  }
  if (
    shareMeta.documentType === "payment_voucher" &&
    canSendPaymentApprovalWhatsApp(shareMeta.lifecycleStatus)
  ) {
    return "approval";
  }
  if (
    shareMeta.documentType === "invoice" &&
    canSendInvoiceApprovalWhatsApp(shareMeta.lifecycleStatus)
  ) {
    return "approval";
  }
  return "none";
}

export function useDocumentActions(
  exportConfig: DocumentExportConfig,
  shareMeta: DocumentShareMeta
) {
  const locale = useLocale();
  const t = useTranslations("documents");
  const tApproval = useTranslations("receiptApproval");
  const company = useDocumentBranding();

  const { previewElementId, pdfFilenamePrefix } = exportConfig;
  const { documentId, documentType, documentNumber, partyName, amountLabel } = shareMeta;

  const exportEnabled = shareMeta.exportEnabled !== false;
  const whatsAppMode = resolveDocumentWhatsAppMode(shareMeta);

  const logActivity = useCallback(
    async (action: "document.exported" | "document.shared") => {
      if (!documentId || !documentType) return;
      try {
        const res = await fetch("/api/documents/activity", {
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
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = data?.error?.message as string | undefined;
          if (message) toast.error(message);
        }
      } catch {
        // best-effort only
      }
    },
    [documentId, documentType, documentNumber]
  );

  const pdfFilename = useMemo(
    () => `${pdfFilenamePrefix}-${documentNumber || "draft"}`,
    [pdfFilenamePrefix, documentNumber]
  );

  const print = useCallback(() => {
    if (!exportEnabled) {
      toast.error(t("exportBlocked"));
      return;
    }
    window.print();
  }, [exportEnabled, t]);

  const exportPdf = useCallback(async () => {
    if (!exportEnabled) {
      toast.error(t("exportBlocked"));
      return;
    }
    try {
      await exportToPdf(previewElementId, pdfFilename);
      toast.success(t("pdfSuccess"));
      void logActivity("document.exported");
    } catch {
      toast.error(t("pdfFailed"));
    }
  }, [exportEnabled, previewElementId, pdfFilename, t, logActivity]);

  const shareWhatsAppFinal = useCallback(() => {
    if (!exportEnabled) {
      toast.error(t("exportBlocked"));
      return;
    }
    const message = t("whatsappMessage", {
      type: shareMeta.documentTitle ?? t("document"),
      number: documentNumber,
      party: partyName || "—",
      amount: amountLabel,
    });
    window.open(generateWhatsAppLink(resolveWhatsAppPhone(company), message), "_blank");
    void logActivity("document.shared");
  }, [
    exportEnabled,
    company,
    documentNumber,
    partyName,
    amountLabel,
    shareMeta.documentTitle,
    t,
    logActivity,
  ]);

  const shareApprovalWhatsApp = useCallback(async () => {
    if (!documentId) return;

    const endpoint =
      documentType === "payment_voucher"
        ? `/api/payment-vouchers/${documentId}/send-approval`
        : documentType === "receipt_voucher"
          ? `/api/receipts/${documentId}/send-approval`
          : documentType === "invoice"
            ? `/api/invoices/${documentId}/send-approval`
            : null;

    if (!endpoint) return;

    const canSend =
      documentType === "receipt_voucher"
        ? canSendReceiptApprovalWhatsApp(shareMeta.lifecycleStatus)
        : documentType === "payment_voucher"
          ? canSendPaymentApprovalWhatsApp(shareMeta.lifecycleStatus)
          : documentType === "invoice"
            ? canSendInvoiceApprovalWhatsApp(shareMeta.lifecycleStatus)
            : false;

    if (!canSend) return;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? tApproval("sendFailed"));
        return;
      }
      const isIssued =
        documentType === "payment_voucher"
          ? isPaymentIssued(shareMeta.lifecycleStatus)
          : documentType === "invoice"
            ? isInvoiceIssued(shareMeta.lifecycleStatus)
            : isReceiptIssued(shareMeta.lifecycleStatus);
      toast.success(
        isIssued
          ? tApproval("sendSuccess")
          : shareMeta.lifecycleStatus === "pending_approval"
            ? tApproval("resendSuccess")
            : tApproval("sendSuccess")
      );
      if (data.whatsAppUrl) {
        window.open(data.whatsAppUrl, "_blank");
      }
    } catch {
      toast.error(tApproval("sendFailed"));
    }
  }, [documentId, documentType, shareMeta.lifecycleStatus, locale, tApproval]);

  const shareWhatsApp = useCallback(() => {
    if (whatsAppMode === "approval") {
      void shareApprovalWhatsApp();
      return;
    }
    if (whatsAppMode === "final") {
      shareWhatsAppFinal();
    }
  }, [whatsAppMode, shareApprovalWhatsApp, shareWhatsAppFinal]);

  return {
    print,
    exportPdf,
    shareWhatsApp,
    exportEnabled,
    whatsAppMode,
    exportDisabledTitle: t("exportBlocked"),
  };
}
