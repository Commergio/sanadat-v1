import { getAppUrl } from "@/lib/env";
import { routing, type Locale } from "@/i18n/routing";

/** Public app origin without trailing slash (works in browser + server). */
export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return getAppUrl();
}

export function sanitizeNextPath(
  next: string | null | undefined,
  locale: Locale = routing.defaultLocale
): string {
  const fallback = `/${locale}/dashboard`;

  if (!next?.startsWith("/")) return fallback;

  if (routing.locales.some((l) => next === `/${l}` || next.startsWith(`/${l}/`))) {
    return next;
  }

  const normalized = next.startsWith("/") ? next : `/${next}`;
  return `/${locale}${normalized}`;
}

export function localeFromNextPath(next: string | null | undefined): Locale {
  if (!next?.startsWith("/")) return routing.defaultLocale;
  const segment = next.split("/")[1];
  if (segment && routing.locales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return routing.defaultLocale;
}

/** Supabase emailRedirectTo / redirectTo — always under /auth/callback (no locale prefix). */
export function buildAuthCallbackUrl(
  nextPath: string,
  locale: Locale = routing.defaultLocale
): string {
  const next = sanitizeNextPath(nextPath, locale);
  const base = getPublicAppUrl();
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function buildAuthCallbackFailureUrl(
  locale: Locale = routing.defaultLocale,
  message = "email-confirmed-login-required"
): string {
  const base = getPublicAppUrl();
  return `${base}/${locale}/login?message=${encodeURIComponent(message)}`;
}
