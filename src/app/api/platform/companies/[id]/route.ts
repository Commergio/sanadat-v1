import { NextResponse } from "next/server";
import { buildPlatformApp } from "@/application/platform";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../_shared";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("staff");
    const { id } = await params;
    const supabase = await createClient();
    const app = buildPlatformApp(supabase);
    const data = await app.getCompany(ctx, id);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
