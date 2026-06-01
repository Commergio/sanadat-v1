export type DocumentType =
  | "receipt_voucher"
  | "payment_voucher"
  | "invoice";

export type DocumentStatus = "active" | "cancelled";

export type PaymentMethod = "cash" | "bank_transfer" | "pos";

export type InvoicePaymentStatus = "paid" | "unpaid" | "partial";

/** Shared immutable fields across all document types */
export interface DocumentBase {
  id: string;
  companyId: string;
  type: DocumentType;
  number: number;
  displayNumber: string;
  status: DocumentStatus;
  date: string;
  amount: number;
  partyName: string;
  description: string | null;
  paymentMethod: PaymentMethod;
  transferNumber: string | null;
  bankName: string | null;
  transferDate: string | null;
  referenceNumber: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Unified registry row — optimized for list/search/dashboard */
export interface DocumentRegistryEntry {
  id: string;
  companyId: string;
  documentType: DocumentType;
  sourceTable: string;
  sourceId: string;
  number: number;
  displayNumber: string;
  status: DocumentStatus;
  date: string;
  amount: number;
  partyName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NextDocumentNumber {
  number: number;
  displayNumber: string;
}

export interface DocumentTypeDefinition {
  code: DocumentType;
  sourceTable: string;
  prefixAr: string;
  prefixEn: string;
  active: boolean;
}

/** Registry of known document types — extend when adding new types */
export const DOCUMENT_TYPE_DEFINITIONS: DocumentTypeDefinition[] = [
  {
    code: "receipt_voucher",
    sourceTable: "receipt_vouchers",
    prefixAr: "قبض",
    prefixEn: "RCP",
    active: true,
  },
  {
    code: "payment_voucher",
    sourceTable: "payment_vouchers",
    prefixAr: "صرف",
    prefixEn: "PAY",
    active: true,
  },
  {
    code: "invoice",
    sourceTable: "invoices",
    prefixAr: "فاتورة",
    prefixEn: "INV",
    active: true,
  },
];

export function getDocumentTypeDefinition(
  type: DocumentType
): DocumentTypeDefinition {
  const def = DOCUMENT_TYPE_DEFINITIONS.find((d) => d.code === type);
  if (!def) throw new Error(`Unknown document type: ${type}`);
  return def;
}
