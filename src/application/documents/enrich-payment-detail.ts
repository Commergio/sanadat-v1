import type { PaymentVoucher as DomainPaymentVoucher } from "@/domain";
import type { PaymentVoucher } from "@/lib/types";
import { toPaymentDetail } from "@/application/documents/payment-voucher.presenter";
import { effectivePaymentLifecycle } from "@/lib/documents/payment-lifecycle";
import { createCustomerSignatureSignedUrl } from "@/lib/storage/customer-signature";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function enrichPaymentDetail(
  payment: DomainPaymentVoucher
): Promise<PaymentVoucher> {
  const lifecycle = effectivePaymentLifecycle(payment.lifecycleStatus);
  const hasCustomerSignaturePath = Boolean(payment.customerSignaturePath?.trim());

  if (lifecycle !== "issued" || !hasCustomerSignaturePath) {
    return toPaymentDetail(payment);
  }

  if (!isServiceRoleConfigured()) {
    return toPaymentDetail(payment);
  }

  try {
    const client = createServiceRoleClient();
    const customerSignatureUrl = await createCustomerSignatureSignedUrl(
      client,
      payment.customerSignaturePath!.trim()
    );
    return toPaymentDetail(payment, { customerSignatureUrl });
  } catch {
    return toPaymentDetail(payment);
  }
}
