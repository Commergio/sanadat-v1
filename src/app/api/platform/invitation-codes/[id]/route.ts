import { NextResponse } from "next/server";
import { buildInvitationCodePlatformApp } from "@/application/invitation-codes";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../_shared";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("admin");
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const app = buildInvitationCodePlatformApp(supabase);
    const data = await app.update(ctx, id, body);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("admin");
    const { id } = await params;
    const supabase = await createClient();
    const app = buildInvitationCodePlatformApp(supabase);
    const data = await app.remove(ctx, id);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
