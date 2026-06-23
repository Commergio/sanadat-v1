import { NextResponse } from "next/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { notifySignupAccountActivated } from "@/application/notifications/account-activated";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/tenant/constants";
import { localeFromNextPath } from "@/lib/auth/callback-url";

/** Sets active company cookie after client-side auth callback establishes session. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let nextRaw: string | null = null;
  try {
    const body = (await request.json().catch(() => ({}))) as { next?: string };
    nextRaw = body.next ?? null;
  } catch {
    nextRaw = null;
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

    const { data: company } = membership?.company_id
      ? await supabase
          .from("companies")
          .select("name")
          .eq("id", membership.company_id)
          .maybeSingle()
      : { data: null };

    const locale = localeFromNextPath(nextRaw);
    const welcomeAlreadySent = Boolean(user.user_metadata?.welcome_email_sent);

    if (
      user.email_confirmed_at &&
      user.email &&
      !welcomeAlreadySent &&
      isServiceRoleConfigured()
    ) {
      void notifySignupAccountActivated({
        userId: user.id,
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.company_name === "string"
              ? user.user_metadata.company_name
              : company?.name ?? null,
        companyName: company?.name ?? null,
        locale,
      });
    }

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
