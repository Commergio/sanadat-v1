import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { routing } from "@/i18n/routing";

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
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  } catch {
    // fall through to login error
  }

  return NextResponse.redirect(
    `${origin}/${routing.defaultLocale}/login?error=auth_callback`
  );
}
