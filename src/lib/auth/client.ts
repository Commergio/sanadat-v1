"use client";

import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export function getSupabaseBrowserClient() {
  return createClient();
}

export function useAuthRedirectUrl(path = "/dashboard") {
  if (typeof window === "undefined") {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect?.startsWith("/")) {
    const clean = redirect.replace(/^\/(ar|en)/, "") || "/dashboard";
    return clean.startsWith("/") ? clean : `/${clean}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export { getAuthErrorMessage };
