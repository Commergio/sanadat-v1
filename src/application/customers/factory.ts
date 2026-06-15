import type { SupabaseClient } from "@supabase/supabase-js";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";
import { CustomerRepository } from "@/infrastructure/supabase/repositories/customers/customer.repository";
import { CustomerVerificationRepository } from "@/infrastructure/supabase/repositories/customers/customer-verification.repository";
import { uploadCustomerSignature } from "@/lib/storage/customer-signature";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { buildCustomerUseCases } from "./use-cases";
import { buildCustomerVerificationUseCases } from "./verification.use-cases";

function buildVerificationDeps(supabase: SupabaseClient) {
  const customerRepository = new CustomerRepository(supabase);
  const verificationRepository = new CustomerVerificationRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildCustomerVerificationUseCases({
    customerRepository,
    verificationRepository,
    activityLog,
    uploadSignature: (companyId, customerId, buffer, contentType) =>
      uploadCustomerSignature(supabase, companyId, customerId, buffer, contentType),
  });
}

export function buildCustomerApp(supabase: SupabaseClient) {
  const repository = new CustomerRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);
  const verification = buildVerificationDeps(supabase);

  return {
    ...buildCustomerUseCases({ repository, activityLog }),
    ...verification,
  };
}

/** Public verification APIs — service role for storage + RPC */
export function buildCustomerVerificationPublicApp() {
  return buildVerificationDeps(createServiceRoleClient());
}
