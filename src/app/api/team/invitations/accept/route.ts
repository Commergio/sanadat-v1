import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerAuthSession } from "@/lib/auth/session";
import { buildTeamApp } from "@/application/team";
import { UseCaseError } from "@/application/shared/use-case-error";
import { mapTeamStatus } from "../../_shared";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
        { status: 401 }
      );
    }
    const supabase = await createClient();
    const app = buildTeamApp(supabase);
    const result = await app.acceptCompanyInvitation(
      { userId: session.userId },
      body.token ?? ""
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapTeamStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to accept invitation" } },
      { status: 500 }
    );
  }
}
