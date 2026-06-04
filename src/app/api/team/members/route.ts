import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildTeamApp } from "@/application/team";
import { UseCaseError } from "@/application/shared/use-case-error";
import { mapTeamStatus } from "../_shared";

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildTeamApp(supabase);
    const items = await app.listCompanyMembers(ctx);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapTeamStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to list team members" } },
      { status: 500 }
    );
  }
}
