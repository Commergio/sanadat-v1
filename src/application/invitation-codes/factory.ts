import type { SupabaseClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ActivityLogRepository, BillingRepository } from "@/infrastructure/supabase/repositories";
import { InvitationCodeRepository } from "@/infrastructure/supabase/repositories/invitation-codes/invitation-code.repository";
import { buildInvitationCodeUseCases } from "./use-cases";

export function buildInvitationCodePlatformApp(supabase: SupabaseClient) {
  const repository = new InvitationCodeRepository(supabase, supabase);
  const billingRepository = new BillingRepository(supabase, supabase);
  return buildInvitationCodeUseCases({ repository, billingRepository });
}

export function buildInvitationCodeTenantApp(readClient: SupabaseClient) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Invitation code apply requires SUPABASE_SERVICE_ROLE_KEY");
  }
  const serviceClient = createServiceRoleClient();
  const repository = new InvitationCodeRepository(readClient, serviceClient);
  const billingRepository = new BillingRepository(readClient, serviceClient);
  const activityLog = new ActivityLogRepository(serviceClient);
  return buildInvitationCodeUseCases({
    repository,
    billingRepository,
    activityLog,
  });
}
