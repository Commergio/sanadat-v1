import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildTeamApp } from "@/application/team";
import { UseCaseError } from "@/application/shared/use-case-error";
import { mapTeamStatus } from "../../_shared";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { role?: "admin" | "accountant" | "viewer" };
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildTeamApp(supabase);
    await app.changeCompanyMemberRole(ctx, id, body.role ?? "viewer");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapTeamStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to change member role" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildTeamApp(supabase);
    await app.removeCompanyMember(ctx, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapTeamStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to remove member" } },
      { status: 500 }
    );
  }
}
