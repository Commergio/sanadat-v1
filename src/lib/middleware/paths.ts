import { routing, type Locale } from "@/i18n/routing";

/**
 * Strips an optional locale prefix from the pathname.
 * Routes are defined under `src/app/[locale]/…` (e.g. `/ar/admin`).
 */
export function parseLocalizedPath(pathname: string): {
  locale: Locale;
  pathWithoutLocale: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && routing.locales.includes(first as Locale)) {
    const rest = segments.slice(1).join("/");
    return {
      locale: first as Locale,
      pathWithoutLocale: rest ? `/${rest}` : "/",
    };
  }

  return {
    locale: routing.defaultLocale,
    pathWithoutLocale: pathname || "/",
  };
}
