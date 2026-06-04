import { NextResponse } from "next/server";
import { buildSupportApp, parseSupportTicketListQuery } from "@/application/support";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../_shared";

export async function GET(request: Request) {
  try {
    const ctx = await requirePlatformContext("staff");
    const query = parseSupportTicketListQuery(new URL(request.url).searchParams);
    const supabase = await createClient();
    const app = buildSupportApp(supabase);
    const result = await app.listPlatform(ctx, query);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
