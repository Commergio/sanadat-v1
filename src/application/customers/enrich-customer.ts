import type { SupabaseClient } from "@supabase/supabase-js";
import type { Customer as DomainCustomer } from "@/domain";
import { toCustomerRow } from "@/application/customers/presenter";
import type { Customer } from "@/lib/types";
import { createCustomerSignatureSignedUrl } from "@/lib/storage/customer-signature";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isServiceRoleConfigured } from "@/lib/env";

export async function enrichCustomerRow(
  customer: DomainCustomer,
  supabase?: SupabaseClient
): Promise<Customer> {
  if (!customer.defaultSignaturePath) {
    return toCustomerRow(customer);
  }

  try {
    const client =
      supabase ?? (isServiceRoleConfigured() ? createServiceRoleClient() : null);
    if (!client) return toCustomerRow(customer);

    const signaturePreviewUrl = await createCustomerSignatureSignedUrl(
      client,
      customer.defaultSignaturePath
    );
    return toCustomerRow(customer, { signaturePreviewUrl });
  } catch {
    return toCustomerRow(customer);
  }
}
