import type { DocumentBase } from "../shared/types";

export interface ReceiptVoucher extends DocumentBase {
  type: "receipt_voucher";
  linkedInvoiceId: string | null;
}

export interface CreateReceiptInput {
  date: string;
  amount: number;
  partyName: string;
  description?: string;
  paymentMethod: DocumentBase["paymentMethod"];
  transferNumber?: string;
  bankName?: string;
  transferDate?: string;
  referenceNumber?: string;
  notes?: string;
  linkedInvoiceId?: string;
}

export interface ReceiptRepository {
  create(
    ctx: import("../../shared/types").TenantContext,
    input: CreateReceiptInput
  ): Promise<ReceiptVoucher>;

  getById(
    ctx: import("../../shared/types").TenantContext,
    id: string
  ): Promise<ReceiptVoucher | null>;
}
