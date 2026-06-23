"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import {
  buildAuthCallbackFailureUrl,
  getPublicAppUrl,
  localeFromNextPath,
  sanitizeNextPath,
} from "@/lib/auth/callback-url";
import { isSupabaseConfigured } from "@/lib/env";

function parseHashParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

async function finalizeSession(nextPath: string): Promise<boolean> {
  const res = await fetch("/api/auth/post-callback", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ next: nextPath }),
  });
  if (!res.ok) return false;

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return false;

  window.location.replace(new URL(nextPath, getPublicAppUrl()).toString());
  return true;
}

function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const nextRaw = searchParams.get("next");
      const locale = localeFromNextPath(nextRaw);
      const nextPath = sanitizeNextPath(nextRaw, locale);
      const fail = (message = "email-confirmed-login-required") => {
        if (cancelled) return;
        window.location.replace(buildAuthCallbackFailureUrl(locale, message));
      };

      const authError = searchParams.get("error");
      const authErrorDescription = searchParams.get("error_description");
      if (authError) {
        setErrorMessage(authErrorDescription ?? authError);
        fail("email-confirmed-login-required");
        return;
      }

      if (!isSupabaseConfigured()) {
        fail("email-confirmed-login-required");
        return;
      }

      const supabase = getSupabaseBrowserClient();

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const otpType = searchParams.get("type");
        const hashParams = parseHashParams();
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && otpType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as EmailOtpType,
          });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            fail("email-confirmed-login-required");
            return;
          }
        }

        const ok = await finalizeSession(nextPath);
        if (!ok) {
          fail("email-confirmed-login-required");
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Auth callback failed";
        setErrorMessage(message);
        fail("email-confirmed-login-required");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-foreground">Sanadat</p>
      <p className="text-sm text-muted-foreground">
        {errorMessage ?? "Completing sign-in…"}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
