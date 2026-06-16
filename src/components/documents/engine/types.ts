import type { NextDocumentNumber } from "@/lib/document-numbers";
import type { DocumentType, DocumentLifecycleStatus } from "@/lib/types";

/** Shared preview element id for all document detail pages. */
export const DETAIL_PREVIEW_ELEMENT_ID = "document-preview";

export interface DocumentShareMeta {
  documentId?: string;
  documentType?: DocumentType;
  documentNumber: string;
  partyName: string;
  amountLabel: string;
  /** Localized document type label for WhatsApp message */
  documentTitle?: string;
  /** When false, PDF/print/final WhatsApp are blocked (receipt approval flow). */
  exportEnabled?: boolean;
  /** Receipt lifecycle — drives approval WhatsApp vs final share. */
  lifecycleStatus?: DocumentLifecycleStatus;
}

export interface DocumentExportConfig {
  previewElementId: string;
  pdfFilenamePrefix: string;
}

export interface DocumentStudioTheme {
  headerAccent: string;
  liveDotPing: string;
  liveDot: string;
  documentSectionIcon: string;
  partySectionIcon: string;
}

export interface DocumentStudioLabels {
  newTitle: string;
  documentTitle: string;
  formTitle: string;
  formSubtitle: string;
  numberLabel: string;
  partySectionTitle: string;
  partySectionDesc: string;
  partyLabel: string;
  partyPlaceholder: string;
  previewPartyPlaceholder: string;
}

export interface DocumentTypeConfig {
  type: DocumentType;
  titleKey: string;
  pdfFilenamePrefix: string;
  previewElementId: string;
  listPath: string;
  /** Studio-only fields */
  draftStorageKey?: string;
  redirectPath?: string;
  getNextNumber?: () => NextDocumentNumber;
  theme?: DocumentStudioTheme;
  labels?: DocumentStudioLabels;
}

export type VoucherDocumentType = Extract<
  DocumentType,
  "receipt_voucher" | "payment_voucher"
>;

export type VoucherStudioConfig = DocumentTypeConfig & {
  type: VoucherDocumentType;
  draftStorageKey: string;
  redirectPath: string;
  getNextNumber: () => NextDocumentNumber;
  theme: DocumentStudioTheme;
  labels: DocumentStudioLabels;
};
