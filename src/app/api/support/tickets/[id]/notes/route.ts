import { NextResponse } from "next/server";
import { buildSupportApp } from "@/application/support";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { createClient } from "@/lib/supabase/server";
import { mapSupportRouteError } from "../../../_shared";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext();
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const app = buildSupportApp(supabase);
    const data = await app.addTenantNote(ctx, id, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mapped = mapSupportRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
