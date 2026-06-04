import { NextResponse } from "next/server";
import { buildPlatformApp } from "@/application/platform";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../../_shared";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("admin");
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const app = buildPlatformApp(supabase);
    const data = await app.setCompanyStatus(ctx, id, body);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
