import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/tenant/constants";

/** Sets active company cookie after client-side auth callback establishes session. */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, reason: "no_session" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const response = NextResponse.json({
      ok: true,
      companyId: membership?.company_id ?? null,
    });

    if (membership?.company_id) {
      response.cookies.set(ACTIVE_COMPANY_COOKIE, membership.company_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ ok: false, reason: "internal" }, { status: 500 });
  }
}
