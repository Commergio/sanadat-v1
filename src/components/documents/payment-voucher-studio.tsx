"use client";

import { VoucherStudio } from "@/components/documents/voucher-studio/voucher-studio";
import { paymentStudioConfig } from "@/components/documents/voucher-studio/config";

export function PaymentVoucherStudio() {
  return <VoucherStudio config={paymentStudioConfig} />;
}
