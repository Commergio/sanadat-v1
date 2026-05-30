/**
 * Runtime environment helpers for MVP prototype vs production.
 * Prototype: works without Supabase or payment keys (mock data + open routes).
 */

const PLACEHOLDER_VALUES = new Set([
  "your_supabase_url",
  "your_supabase_anon_key",
  "your_service_role_key",
]);

function readEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function isSupabaseConfigured(): boolean {
  const url = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) return false;
  if (PLACEHOLDER_VALUES.has(url) || PLACEHOLDER_VALUES.has(key)) return false;
  return true;
}

/** True when running the management-review prototype (no real backend required). */
export const IS_DEMO_MODE =
  !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function getAppUrl(): string {
  return readEnv(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000";
}
