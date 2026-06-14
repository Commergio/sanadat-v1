import { NextResponse } from "next/server";
import { buildPlatformApp } from "@/application/platform";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../_shared";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const ctx = await requirePlatformContext("admin");
    const { profileId } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const app = buildPlatformApp(supabase);
    const data = await app.changeStaffRole(ctx, profileId, body);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const ctx = await requirePlatformContext("admin");
    const { profileId } = await params;
    const supabase = await createClient();
    const app = buildPlatformApp(supabase);
    const data = await app.removeStaff(ctx, profileId);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
