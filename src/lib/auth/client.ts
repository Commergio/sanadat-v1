"use client";

import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { stripLocaleFromPath } from "@/lib/auth/post-login-redirect";

export function getSupabaseBrowserClient() {
  return createClient();
}

export function useAuthRedirectUrl(path = "/dashboard") {
  if (typeof window === "undefined") {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  if (returnTo?.startsWith("/")) {
    return stripLocaleFromPath(returnTo, path);
  }
  const redirect = params.get("redirect");
  if (redirect?.startsWith("/")) {
    return stripLocaleFromPath(redirect, path);
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export { getAuthErrorMessage };
