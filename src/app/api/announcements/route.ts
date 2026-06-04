import { NextResponse } from "next/server";
import { buildAnnouncementApp } from "@/application/announcements";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { createClient } from "@/lib/supabase/server";
import { mapAnnouncementRouteError } from "./_shared";

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildAnnouncementApp(supabase);
    const data = await app.listForTenant(ctx);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapAnnouncementRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
