import type { PaymentMethod } from "@/domain";

export interface InvoiceApprovalSnapshotItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
}

export interface InvoiceApprovalSnapshot {
  date: string;
  partyName: string;
  description: string | null;
  paymentMethod: PaymentMethod;
  transferNumber: string | null;
  bankName: string | null;
  referenceNumber: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceApprovalSnapshotItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface InvoiceApprovalPayload {
  invoiceId: string;
  companyId: string;
  companyName: string;
  companyNameEn: string | null;
  companyPhone: string | null;
  companyCrNumber: string | null;
  companyVatNumber: string | null;
  companyAddress: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerVerified: boolean;
  customerSignaturePath: string | null;
  lifecycleStatus: string;
  snapshot: InvoiceApprovalSnapshot;
  tokenExpiresAt: string | null;
  tokenUsedAt: string | null;
  tokenExpired: boolean;
  tokenValid: boolean;
}

export interface SendInvoiceApprovalResult {
  approvalUrl: string;
  whatsAppUrl: string;
  expiresAt: string;
  customerPhone: string;
}

export interface ApproveInvoiceResult {
  invoiceId: string;
  companyId: string;
  displayNumber: string;
}
