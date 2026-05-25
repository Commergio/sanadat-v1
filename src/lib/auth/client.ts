"use client";

import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export function getSupabaseBrowserClient() {
  return createClient();
}

export function useAuthRedirectUrl(path = "/dashboard") {
  const locale = useLocale();
  if (typeof window === "undefined") {
    return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
  }
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect?.startsWith("/")) {
    const clean = redirect.replace(/^\/(ar|en)/, "") || "/dashboard";
    return `/${locale}${clean.startsWith("/") ? clean : `/${clean}`}`;
  }
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

export { getAuthErrorMessage };
