import type { SupabaseClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { CouponRepository } from "@/infrastructure/supabase/repositories/coupons/coupon.repository";
import { buildCouponUseCases } from "./use-cases";

/** Platform staff CRUD — authenticated session + RLS. */
export function buildCouponPlatformApp(supabase: SupabaseClient) {
  const repository = new CouponRepository(supabase, supabase);
  return buildCouponUseCases({ repository });
}

/** Tenant validate + checkout writes — service role for coupon reads/counts/redemptions. */
export function buildCouponBillingApp(readClient: SupabaseClient) {
  const writeClient = isServiceRoleConfigured()
    ? createServiceRoleClient()
    : readClient;
  const repository = new CouponRepository(readClient, writeClient);
  return buildCouponUseCases({ repository });
}
