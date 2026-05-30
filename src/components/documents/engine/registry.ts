import {
  getNextPaymentNumber,
  getNextReceiptNumber,
} from "@/lib/document-numbers";
import type { DocumentType, Invoice, PaymentVoucher, ReceiptVoucher } from "@/lib/types";
import type { DocumentTypeConfig, VoucherStudioConfig } from "./types";

export const receiptStudioConfig: VoucherStudioConfig = {
  type: "receipt_voucher",
  titleKey: "receipt",
  pdfFilenamePrefix: "sanadat-receipt",
  previewElementId: "receipt-voucher-preview",
  listPath: "/dashboard/receipts",
  draftStorageKey: "sanadat-draft-receipt",
  redirectPath: "/dashboard/receipts",
  getNextNumber: getNextReceiptNumber,
  theme: {
    headerAccent: "text-emerald-600 dark:text-emerald-400",
    liveDotPing: "bg-emerald-400",
    liveDot: "bg-emerald-500",
    documentSectionIcon: "bg-emerald-500/10 text-emerald-600",
    partySectionIcon: "bg-blue-500/10 text-blue-600",
  },
  labels: {
    newTitle: "newReceipt",
    documentTitle: "receipt",
    formTitle: "formTitleReceipt",
    formSubtitle: "formSubtitle",
    numberLabel: "receiptNumber",
    partySectionTitle: "sectionCustomer",
    partySectionDesc: "sectionCustomerDesc",
    partyLabel: "customerName",
    partyPlaceholder: "customerPlaceholder",
    previewPartyPlaceholder: "previewCustomerPlaceholder",
  },
};

export const paymentStudioConfig: VoucherStudioConfig = {
  type: "payment_voucher",
  titleKey: "payment",
  pdfFilenamePrefix: "sanadat-payment",
  previewElementId: "payment-voucher-preview",
  listPath: "/dashboard/payments",
  draftStorageKey: "sanadat-draft-payment",
  redirectPath: "/dashboard/payments",
  getNextNumber: getNextPaymentNumber,
  theme: {
    headerAccent: "text-amber-600 dark:text-amber-400",
    liveDotPing: "bg-amber-400",
    liveDot: "bg-amber-500",
    documentSectionIcon: "bg-amber-500/10 text-amber-600",
    partySectionIcon: "bg-orange-500/10 text-orange-600",
  },
  labels: {
    newTitle: "newPayment",
    documentTitle: "payment",
    formTitle: "formTitlePayment",
    formSubtitle: "formSubtitle",
    numberLabel: "paymentNumber",
    partySectionTitle: "sectionPayee",
    partySectionDesc: "sectionPayeeDesc",
    partyLabel: "payeeName",
    partyPlaceholder: "payeePlaceholder",
    previewPartyPlaceholder: "previewPayeePlaceholder",
  },
};

export const invoiceDocumentConfig: DocumentTypeConfig = {
  type: "invoice",
  titleKey: "invoice",
  pdfFilenamePrefix: "sanadat-invoice",
  previewElementId: "document-preview",
  listPath: "/dashboard/invoices",
};

export const documentRegistry: Record<DocumentType, DocumentTypeConfig> = {
  receipt_voucher: receiptStudioConfig,
  payment_voucher: paymentStudioConfig,
  invoice: invoiceDocumentConfig,
};

export function getDocumentConfig(type: DocumentType): DocumentTypeConfig {
  return documentRegistry[type];
}

export function getDocumentAmount(
  document: ReceiptVoucher | PaymentVoucher | Invoice
): number {
  return document.type === "invoice" ? document.total : document.amount;
}

export function detailPath(type: DocumentType, id: string): string {
  return `${documentRegistry[type].listPath}/${id}`;
}
