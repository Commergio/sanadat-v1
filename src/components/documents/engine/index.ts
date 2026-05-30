export {
  documentRegistry,
  receiptStudioConfig,
  paymentStudioConfig,
  invoiceDocumentConfig,
  getDocumentConfig,
  getDocumentAmount,
  detailPath,
} from "./registry";

export {
  DETAIL_PREVIEW_ELEMENT_ID,
  type DocumentExportConfig,
  type DocumentShareMeta,
  type DocumentStudioLabels,
  type DocumentStudioTheme,
  type DocumentTypeConfig,
  type VoucherDocumentType,
  type VoucherStudioConfig,
} from "./types";

export { useDocumentBranding, resolveWhatsAppPhone } from "./use-document-branding";
export { useDocumentActions } from "./use-document-actions";
export { DocumentActionButtons } from "./document-action-buttons";
export { DocumentStudioToolbar } from "./document-studio-toolbar";
export { DocumentPreviewShell } from "./document-preview-shell";
export { DocumentDetailView } from "./document-detail-view";
export { buildVoucherPreview, type VoucherPreviewInput } from "./build-voucher-preview";

/** Client-side PDF rasterization (html2canvas + jsPDF). */
export { exportToPdf } from "@/lib/pdf-export";
