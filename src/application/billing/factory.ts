import type { SupabaseClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ActivityLogRepository, BillingRepository } from "@/infrastructure/supabase/repositories";
import { CouponRepository } from "@/infrastructure/supabase/repositories/coupons/coupon.repository";
import { buildCouponUseCases } from "@/application/coupons/use-cases";
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
  const couponRepository = new CouponRepository(readClient, writeClient);
  const coupons = buildCouponUseCases({ repository: couponRepository });
  const activityLog = isServiceRoleConfigured()
    ? new ActivityLogRepository(writeClient)
    : undefined;
  return buildBillingUseCases({ repository, activityLog, coupons });
}

/** Service-role only — for webhook routes (no user session). */
export function buildBillingWebhookApp() {
  const client = createServiceRoleClient();
  const repository = new BillingRepository(client, client);
  const activityLog = new ActivityLogRepository(client);
  return buildBillingUseCases({ repository, activityLog });
}
