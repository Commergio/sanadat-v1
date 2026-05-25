import type { AuthError } from "@supabase/supabase-js";

export type AuthErrorKey =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_already_registered"
  | "weak_password"
  | "over_email_send_rate_limit"
  | "same_password"
  | "session_not_found"
  | "unexpected"
  | "tryAgain";

const AUTH_ERROR_KEYS = new Set<string>([
  "invalid_credentials",
  "email_not_confirmed",
  "user_already_registered",
  "weak_password",
  "over_email_send_rate_limit",
  "same_password",
  "session_not_found",
]);

export function resolveAuthErrorKey(
  error: AuthError | Error | null
): AuthErrorKey {
  if (!error) return "unexpected";

  const authError = error as AuthError;
  const code = authError.code ?? authError.message;

  if (code && AUTH_ERROR_KEYS.has(code)) {
    return code as AuthErrorKey;
  }

  if (authError.message?.includes("Invalid login credentials")) {
    return "invalid_credentials";
  }
  if (authError.message?.includes("already registered")) {
    return "user_already_registered";
  }
  if (authError.message?.includes("Email not confirmed")) {
    return "email_not_confirmed";
  }

  return "tryAgain";
}

export function getAuthErrorMessage(
  error: AuthError | Error | null,
  t: (key: string) => string
): string {
  const key = resolveAuthErrorKey(error);
  return t(`errors.${key}`);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
