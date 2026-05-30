"use client";

import { VoucherStudio } from "@/components/documents/voucher-studio/voucher-studio";
import { receiptStudioConfig } from "@/components/documents/voucher-studio/config";

export function ReceiptVoucherStudio() {
  return <VoucherStudio config={receiptStudioConfig} />;
}
