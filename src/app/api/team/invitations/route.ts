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
    const items = await app.listCompanyInvitations(ctx);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapTeamStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to list invitations" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { email?: string; role?: "admin" | "accountant" | "viewer" };
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildTeamApp(supabase);
    const result = await app.inviteCompanyMember(ctx, {
      email: input.email ?? "",
      role: (input.role ?? "accountant") as "admin" | "accountant" | "viewer",
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapTeamStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to invite member" } },
      { status: 500 }
    );
  }
}
