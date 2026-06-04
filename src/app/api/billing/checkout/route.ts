import { NextResponse } from "next/server";
import { buildBillingApp } from "@/application/billing";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { mapBillingRouteError } from "../_shared";

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = await request.json();
    const supabase = await createClient();
    const app = buildBillingApp(supabase);
    const result = await app.startCheckout(ctx, body);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
