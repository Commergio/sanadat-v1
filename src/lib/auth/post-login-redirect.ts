import { routing, type Locale } from "@/i18n/routing";

export function buildLoginUrl(
  requestUrl: string,
  locale: Locale,
  returnTo: string
): URL {
  const loginUrl = new URL(`/${locale}/login`, requestUrl);
  loginUrl.searchParams.set("returnTo", returnTo);
  return loginUrl;
}

/** Resolve post-login destination from query params (returnTo preferred). */
export function resolveAuthenticatedRedirect(
  searchParams: URLSearchParams,
  locale: Locale,
  defaultRelativePath = "/dashboard"
): string {
  const candidate =
    searchParams.get("returnTo") ?? searchParams.get("redirect");

  if (candidate?.startsWith("/")) {
    if (
      routing.locales.some(
        (l) => candidate === `/${l}` || candidate.startsWith(`/${l}/`)
      )
    ) {
      return candidate;
    }
    return `/${locale}${candidate}`;
  }

  const fallback = defaultRelativePath.startsWith("/")
    ? defaultRelativePath
    : `/${defaultRelativePath}`;
  return `/${locale}${fallback}`;
}

/** Strip /ar or /en prefix for next-intl client router paths. */
export function stripLocaleFromPath(path: string, fallback = "/dashboard"): string {
  const cleaned = path.replace(/^\/(ar|en)(?=\/|$)/, "") || fallback;
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}
