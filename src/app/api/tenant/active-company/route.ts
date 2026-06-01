import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  activeCompanyCookieOptions,
  listUserMemberships,
  resolveTenantContext,
} from "@/lib/tenant";

/**
 * POST /api/tenant/active-company
 * Body: { companyId: string }
 * Sets the active tenant cookie after validating membership.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "NOT_CONFIGURED", message: "Supabase is not configured" } },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const companyId = typeof body.companyId === "string" ? body.companyId : null;

    if (!companyId) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "companyId is required" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const memberships = await listUserMemberships(supabase, user.id);
    if (!memberships.some((m) => m.companyId === companyId)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not a member of this company" } },
        { status: 403 }
      );
    }

    const ctx = await resolveTenantContext(supabase, companyId);
    const response = NextResponse.json({
      companyId: ctx.companyId,
      role: ctx.role,
      companyName: ctx.company.name,
    });

    const cookie = activeCompanyCookieOptions(companyId);
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to switch company" } },
      { status: 500 }
    );
  }
}
