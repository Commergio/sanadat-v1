import type { ReceiptVoucher as DomainReceiptVoucher } from "@/domain";
import type { ReceiptVoucher } from "@/lib/types";
import { toReceiptDetail } from "@/application/documents/receipt-voucher.presenter";
import { effectiveReceiptLifecycle } from "@/lib/documents/receipt-lifecycle";
import { createCustomerSignatureSignedUrl } from "@/lib/storage/customer-signature";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function enrichReceiptDetail(
  receipt: DomainReceiptVoucher
): Promise<ReceiptVoucher> {
  const lifecycle = effectiveReceiptLifecycle(receipt.lifecycleStatus);
  const hasCustomerSignaturePath = Boolean(receipt.customerSignaturePath?.trim());

  if (lifecycle !== "issued" || !hasCustomerSignaturePath) {
    return toReceiptDetail(receipt);
  }

  if (!isServiceRoleConfigured()) {
    return toReceiptDetail(receipt);
  }

  try {
    const client = createServiceRoleClient();
    const customerSignatureUrl = await createCustomerSignatureSignedUrl(
      client,
      receipt.customerSignaturePath!.trim()
    );
    return toReceiptDetail(receipt, { customerSignatureUrl });
  } catch {
    return toReceiptDetail(receipt);
  }
}
