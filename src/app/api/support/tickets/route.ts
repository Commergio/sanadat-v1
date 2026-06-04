import { NextResponse } from "next/server";
import { buildSupportApp, parseSupportTicketListQuery } from "@/application/support";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { createClient } from "@/lib/supabase/server";
import { mapSupportRouteError } from "../_shared";

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const query = parseSupportTicketListQuery(new URL(request.url).searchParams);
    const supabase = await createClient();
    const app = buildSupportApp(supabase);
    const result = await app.listTenant(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapSupportRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = await request.json();
    const supabase = await createClient();
    const app = buildSupportApp(supabase);
    const data = await app.createTenant(ctx, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mapped = mapSupportRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
