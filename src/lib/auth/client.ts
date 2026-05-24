"use client";

import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export function getSupabaseBrowserClient() {
  return createClient();
}

export function getAuthRedirectUrl(path = "/ar/dashboard") {
  if (typeof window === "undefined") return path;
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect?.startsWith("/")) {
    return redirect.startsWith("/ar") ? redirect : `/ar${redirect}`;
  }
  return path;
}

export { getAuthErrorMessage };
