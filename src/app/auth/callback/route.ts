import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${routing.defaultLocale}/dashboard`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const safePath = next.startsWith("/") ? next : `/${routing.defaultLocale}/dashboard`;
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/${routing.defaultLocale}/login?error=auth_callback`
  );
}
