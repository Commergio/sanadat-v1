import type { Invoice as DomainInvoice } from "@/domain";
import type { Invoice } from "@/lib/types";
import { toInvoiceDetail } from "@/application/documents/invoice.presenter";
import { effectiveInvoiceLifecycle } from "@/lib/documents/invoice-lifecycle";
import { createCustomerSignatureSignedUrl } from "@/lib/storage/customer-signature";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function enrichInvoiceDetail(invoice: DomainInvoice): Promise<Invoice> {
  const lifecycle = effectiveInvoiceLifecycle(invoice.lifecycleStatus);
  const hasCustomerSignaturePath = Boolean(invoice.customerSignaturePath?.trim());

  if (lifecycle !== "issued" || !hasCustomerSignaturePath) {
    return toInvoiceDetail(invoice);
  }

  if (!isServiceRoleConfigured()) {
    return toInvoiceDetail(invoice);
  }

  try {
    const client = createServiceRoleClient();
    const customerSignatureUrl = await createCustomerSignatureSignedUrl(
      client,
      invoice.customerSignaturePath!.trim()
    );
    return toInvoiceDetail(invoice, { customerSignatureUrl });
  } catch {
    return toInvoiceDetail(invoice);
  }
}
