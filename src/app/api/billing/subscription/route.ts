import { NextResponse } from "next/server";
import { buildBillingReadApp } from "@/application/billing";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { mapBillingRouteError } from "../_shared";

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildBillingReadApp(supabase);
    const subscription = await app.getSubscription(ctx);
    return NextResponse.json({ subscription });
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
