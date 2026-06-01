import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { routing } from "@/i18n/routing";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/tenant/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${routing.defaultLocale}/dashboard`;
  const safePath = next.startsWith("/") ? next : `/${routing.defaultLocale}/dashboard`;

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(`${origin}${safePath}`);
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = NextResponse.redirect(`${origin}${safePath}`);

      if (user) {
        const { data: membership } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id)
          .order("accepted_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membership?.company_id) {
          response.cookies.set(ACTIVE_COMPANY_COOKIE, membership.company_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
          });
        }
      }

      return response;
    }
  } catch {
    // fall through to login error
  }

  return NextResponse.redirect(
    `${origin}/${routing.defaultLocale}/login?error=auth_callback`
  );
}
