import type { DocumentBase } from "../shared/types";

export interface PaymentVoucher extends DocumentBase {
  type: "payment_voucher";
}

export interface CreatePaymentInput {
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
}

export interface PaymentRepository {
  create(
    ctx: import("../../shared/types").TenantContext,
    input: CreatePaymentInput
  ): Promise<PaymentVoucher>;

  getById(
    ctx: import("../../shared/types").TenantContext,
    id: string
  ): Promise<PaymentVoucher | null>;
}
