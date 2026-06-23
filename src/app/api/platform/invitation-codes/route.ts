import { NextResponse } from "next/server";
import { buildInvitationCodePlatformApp } from "@/application/invitation-codes";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../_shared";
import { parseInvitationCodeListQuery } from "./_query";

export async function GET(request: Request) {
  try {
    const ctx = await requirePlatformContext("staff");
    const query = parseInvitationCodeListQuery(new URL(request.url).searchParams);
    const supabase = await createClient();
    const app = buildInvitationCodePlatformApp(supabase);
    const result = await app.listPlatform(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requirePlatformContext("admin");
    const body = await request.json();
    const supabase = await createClient();
    const app = buildInvitationCodePlatformApp(supabase);
    const data = await app.create(ctx, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
