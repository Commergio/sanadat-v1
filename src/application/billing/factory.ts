import type { SupabaseClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ActivityLogRepository, BillingRepository } from "@/infrastructure/supabase/repositories";
import { buildBillingUseCases } from "./use-cases";

/** Tenant session reads only — does not require service role. */
export function buildBillingReadApp(readClient: SupabaseClient) {
  const repository = new BillingRepository(readClient, readClient);
  return buildBillingUseCases({ repository });
}

/** Checkout + writes — requires service role when starting checkout. */
export function buildBillingApp(readClient: SupabaseClient) {
  const writeClient = isServiceRoleConfigured()
    ? createServiceRoleClient()
    : readClient;
  const repository = new BillingRepository(readClient, writeClient);
  const activityLog = isServiceRoleConfigured()
    ? new ActivityLogRepository(writeClient)
    : undefined;
  return buildBillingUseCases({ repository, activityLog });
}

/** Service-role only — for webhook routes (no user session). */
export function buildBillingWebhookApp() {
  const client = createServiceRoleClient();
  const repository = new BillingRepository(client, client);
  const activityLog = new ActivityLogRepository(client);
  return buildBillingUseCases({ repository, activityLog });
}
