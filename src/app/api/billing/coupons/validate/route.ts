import { NextResponse } from "next/server";
import {
  buildCouponBillingApp,
  toValidateCouponResponse,
} from "@/application/coupons";
import { resolvePlanPrice } from "@/application/billing/constants";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { mapBillingRouteError } from "../../_shared";

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = await request.json();
    const supabase = await createClient();
    const app = buildCouponBillingApp(supabase);
    const result = await app.validateForCheckout(ctx, body);
    const planAmount = body?.plan_code
      ? resolvePlanPrice(String(body.plan_code))?.amount
      : undefined;
    return NextResponse.json(toValidateCouponResponse(result, planAmount));
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
