import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { isSupabaseConfigured } from "./lib/env";
import { updateSession } from "./lib/supabase/middleware";
import { ACTIVE_COMPANY_COOKIE } from "./lib/tenant/constants";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/dashboard"];
const authRoutes = ["/login", "/register", "/forgot-password"];
const adminPrefix = "/admin";

function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
  return target;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || "ar";
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const isProtected = protectedPrefixes.some((p) =>
    pathWithoutLocale.startsWith(p)
  );
  const isAuthRoute = authRoutes.some((r) => pathWithoutLocale.startsWith(r));
  const isAdminRoute = pathWithoutLocale.startsWith(adminPrefix);

  if (!isSupabaseConfigured()) {
    if (isProtected || isAdminRoute) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(loginUrl);
    }
    return intlMiddleware(request);
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathWithoutLocale);
    return withCookies(NextResponse.redirect(loginUrl), supabaseResponse);
  }

  if (isAuthRoute && user) {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const target = redirect?.startsWith("/")
      ? redirect.startsWith(`/${locale}`)
        ? redirect
        : `/${locale}${redirect}`
      : `/${locale}/dashboard`;
    return withCookies(
      NextResponse.redirect(new URL(target, request.url)),
      supabaseResponse
    );
  }

  // P0: platform admin backend not implemented — block /admin
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return withCookies(NextResponse.redirect(loginUrl), supabaseResponse);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .single();

    if (profile?.platform_role !== "platform_admin") {
      return withCookies(
        NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url)),
        supabaseResponse
      );
    }
  }

  // Ensure active company cookie when entering dashboard
  if (isProtected && user && !request.cookies.get(ACTIVE_COMPANY_COOKIE)?.value) {
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membership?.company_id) {
      const intlResponse = intlMiddleware(request);
      intlResponse.cookies.set(ACTIVE_COMPANY_COOKIE, membership.company_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return withCookies(intlResponse, supabaseResponse);
    }
  }

  const intlResponse = intlMiddleware(request);
  return withCookies(intlResponse, supabaseResponse);
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
