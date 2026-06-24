import type { SupabaseClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ActivityLogRepository, BillingRepository, CouponRepository, ManualPaymentRepository } from "@/infrastructure/supabase/repositories";
import { buildCouponUseCases } from "@/application/coupons/use-cases";
import { buildManualPaymentUseCases } from "./manual-payment-use-cases";

function buildCoupons(readClient: SupabaseClient, writeClient: SupabaseClient) {
  const couponRepository = new CouponRepository(readClient, writeClient);
  return buildCouponUseCases({ repository: couponRepository });
}

function buildApp(readClient: SupabaseClient, writeClient: SupabaseClient) {
  const billingRepository = new BillingRepository(readClient, writeClient);
  const manualPaymentRepository = new ManualPaymentRepository(readClient, writeClient);
  const activityLog = isServiceRoleConfigured()
    ? new ActivityLogRepository(writeClient)
    : undefined;
  const coupons = isServiceRoleConfigured() ? buildCoupons(readClient, writeClient) : undefined;

  return buildManualPaymentUseCases({
    manualPaymentRepository,
    billingRepository,
    activityLog,
    serviceRoleClient: writeClient,
    coupons,
  });
}

/** Tenant reads — no service role required. */
export function buildManualPaymentReadApp(readClient: SupabaseClient) {
  return buildApp(readClient, readClient);
}

/** Tenant submit — requires service role for storage upload. */
export function buildManualPaymentTenantApp(readClient: SupabaseClient) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Manual payment requires SUPABASE_SERVICE_ROLE_KEY");
  }
  const serviceClient = createServiceRoleClient();
  return buildApp(readClient, serviceClient);
}

/** Platform admin review — requires service role for approve storage/signing. */
export function buildManualPaymentPlatformApp(readClient: SupabaseClient) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Manual payment requires SUPABASE_SERVICE_ROLE_KEY");
  }
  const serviceClient = createServiceRoleClient();
  return buildApp(readClient, serviceClient);
}

export function buildManualPaymentApp(readClient: SupabaseClient) {
  return buildManualPaymentPlatformApp(readClient);
}
