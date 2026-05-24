import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/dashboard", "/admin"];
const authRoutes = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || "ar";
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const isProtected = protectedPrefixes.some((p) =>
    pathWithoutLocale.startsWith(p)
  );
  const isAuthRoute = authRoutes.some((r) => pathWithoutLocale.startsWith(r));

  const sessionCookie = request.cookies.get("sb-access-token")?.value;

  if (isProtected && !sessionCookie && !isDemoMode) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && sessionCookie && !isDemoMode) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
