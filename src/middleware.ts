import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/dashboard", "/admin"];
const authRoutes = ["/login", "/register", "/forgot-password"];

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
  const isAdminRoute = pathWithoutLocale.startsWith("/admin");

  if (isDemoMode) {
    return intlMiddleware(request);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (isProtected) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
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

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return withCookies(
        NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url)),
        supabaseResponse
      );
    }
  }

  const intlResponse = intlMiddleware(request);
  return withCookies(intlResponse, supabaseResponse);
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
