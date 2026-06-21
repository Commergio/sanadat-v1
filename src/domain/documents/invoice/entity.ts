import type { DocumentBase, InvoicePaymentStatus } from "../shared/types";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
}

export interface Invoice extends DocumentBase {
  type: "invoice";
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: InvoicePaymentStatus;
  linkedReceiptId: string | null;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  date: string;
  partyName: string;
  customerId: string;
  description?: string;
  paymentMethod: DocumentBase["paymentMethod"];
  transferNumber?: string;
  bankName?: string;
  referenceNumber?: string;
  items: CreateInvoiceItemInput[];
  discount?: number;
  tax?: number;
  notes?: string;
}

export interface InvoiceRepository {
  create(
    ctx: import("../../shared/types").TenantContext,
    input: CreateInvoiceInput
  ): Promise<Invoice>;

  getById(
    ctx: import("../../shared/types").TenantContext,
    id: string
  ): Promise<Invoice | null>;
}
