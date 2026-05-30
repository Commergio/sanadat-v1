import type { PaymentMethod, PaymentVoucher, ReceiptVoucher } from "@/lib/types";
import type { VoucherDocumentType } from "./types";

export interface VoucherPreviewInput {
  documentType: VoucherDocumentType;
  number: number;
  displayNumber: string;
  date?: string;
  amount?: number | string;
  party_name?: string;
  description?: string;
  payment_method?: PaymentMethod | string;
  transfer_number?: string;
  bank_name?: string;
  transfer_date?: string;
  reference_number?: string;
}

export function buildVoucherPreview(
  input: VoucherPreviewInput
): ReceiptVoucher | PaymentVoucher {
  const now = new Date().toISOString();
  const base = {
    id: "draft",
    company_id: "comp-1",
    number: input.number,
    display_number: input.displayNumber,
    status: "active" as const,
    date: input.date ?? new Date().toISOString().split("T")[0],
    amount: Number(input.amount) || 0,
    party_name: input.party_name ?? "",
    description: input.description,
    payment_method: (input.payment_method ?? "cash") as PaymentMethod,
    transfer_number: input.transfer_number,
    bank_name: input.bank_name,
    transfer_date: input.transfer_date,
    reference_number: input.reference_number,
    created_at: now,
    updated_at: now,
  };

  if (input.documentType === "receipt_voucher") {
    return { ...base, type: "receipt_voucher" };
  }
  return { ...base, type: "payment_voucher" };
}
