/**
 * Runtime environment helpers for production Sanadat.
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

export function isServiceRoleConfigured(): boolean {
  if (!isSupabaseConfigured()) return false;
  const key = readEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key || PLACEHOLDER_VALUES.has(key)) return false;
  return true;
}

export function getAppUrl(): string {
  return readEnv(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000";
}

/** Shared secret for POST /api/billing/webhook/manual (internal testing only). */
export function getManualWebhookSecret(): string | null {
  const secret = readEnv(process.env.BILLING_MANUAL_WEBHOOK_SECRET);
  if (!secret || PLACEHOLDER_VALUES.has(secret)) return null;
  return secret;
}

export function isManualWebhookConfigured(): boolean {
  return getManualWebhookSecret() !== null;
}
