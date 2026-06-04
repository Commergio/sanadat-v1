import createMiddleware from "next-intl/middleware";
import { NextResponse, NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { hasPlatformStaffAccess } from "./lib/auth/platform-staff";
import {
  buildLoginUrl,
  resolveAuthenticatedRedirect,
} from "./lib/auth/post-login-redirect";
import { isSupabaseConfigured } from "./lib/env";
import { parseLocalizedPath } from "./lib/middleware/paths";
import { updateSession } from "./lib/supabase/middleware";
import { ACTIVE_COMPANY_COOKIE } from "./lib/tenant/constants";

const intlMiddleware = createMiddleware(routing);

const tenantProtectedPrefixes = ["/dashboard"];
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
  const { locale, pathWithoutLocale } = parseLocalizedPath(pathname);

  const isTenantRoute = tenantProtectedPrefixes.some((p) =>
    pathWithoutLocale.startsWith(p)
  );
  const isAuthRoute = authRoutes.some((r) => pathWithoutLocale.startsWith(r));
  const isAdminRoute = pathWithoutLocale.startsWith(adminPrefix);

  if (!isSupabaseConfigured()) {
    if (isTenantRoute || isAdminRoute) {
      const loginUrl = buildLoginUrl(request.url, locale, pathname);
      loginUrl.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(loginUrl);
    }
    return intlMiddleware(request);
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  // ─── Platform admin console (before tenant/dashboard guards) ───────────────
  if (isAdminRoute) {
    if (!user) {
      return withCookies(
        NextResponse.redirect(buildLoginUrl(request.url, locale, pathname)),
        supabaseResponse
      );
    }

    const isStaff = await hasPlatformStaffAccess(supabase, user.id);
    if (!isStaff) {
      return withCookies(
        NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url)),
        supabaseResponse
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    const intlResponse = intlMiddleware(
      new NextRequest(request.url, { headers: requestHeaders })
    );
    return withCookies(intlResponse, supabaseResponse);
  }

  // ─── Tenant dashboard (requires auth + company context in pages/APIs) ──────
  if (isTenantRoute && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathWithoutLocale);
    return withCookies(NextResponse.redirect(loginUrl), supabaseResponse);
  }

  if (isAuthRoute && user) {
    const target = resolveAuthenticatedRedirect(
      request.nextUrl.searchParams,
      locale
    );
    return withCookies(
      NextResponse.redirect(new URL(target, request.url)),
      supabaseResponse
    );
  }

  if (
    isTenantRoute &&
    user &&
    !request.cookies.get(ACTIVE_COMPANY_COOKIE)?.value
  ) {
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
