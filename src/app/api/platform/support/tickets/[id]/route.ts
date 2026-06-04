import { NextResponse } from "next/server";
import { buildSupportApp } from "@/application/support";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../../_shared";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("staff");
    const { id } = await params;
    const supabase = await createClient();
    const app = buildSupportApp(supabase);
    const data = await app.getPlatform(ctx, id);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("staff");
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const app = buildSupportApp(supabase);
    const data = await app.updatePlatform(ctx, id, body);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
