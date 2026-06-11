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

/**
 * Public app base URL (no trailing slash).
 * Vercel: set NEXT_PUBLIC_APP_URL to your production domain, or rely on VERCEL_* fallbacks.
 */
export function getAppUrl(): string {
  const explicit = readEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return explicit.replace(/\/$/, "");

  const productionHost = readEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (productionHost) return `https://${productionHost.replace(/\/$/, "")}`;

  const deploymentHost = readEnv(process.env.VERCEL_URL);
  if (deploymentHost) return `https://${deploymentHost.replace(/\/$/, "")}`;

  return "http://localhost:3000";
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

/** Moyasar sandbox secret key (`sk_test_...`) — server only. */
export function getMoyasarSecretKey(): string | null {
  const key = readEnv(process.env.MOYASAR_SECRET_KEY);
  if (!key || PLACEHOLDER_VALUES.has(key)) return null;
  return key;
}

/** Moyasar sandbox publishable key (`pk_test_...`) — safe for client if needed later. */
export function getMoyasarPublicKey(): string | null {
  const key = readEnv(process.env.MOYASAR_PUBLIC_KEY);
  if (!key || PLACEHOLDER_VALUES.has(key)) return null;
  return key;
}

export interface MoyasarEnvValidation {
  ok: boolean;
  message?: string;
}

/**
 * P2.5.1: only sandbox test keys are allowed.
 * Rejects missing, placeholder, and live (`sk_live_` / `pk_live_`) keys.
 */
export function validateMoyasarSandboxEnv(): MoyasarEnvValidation {
  const secret = getMoyasarSecretKey();
  const publicKey = getMoyasarPublicKey();

  if (!secret || !publicKey) {
    return {
      ok: false,
      message: "MOYASAR_SECRET_KEY and MOYASAR_PUBLIC_KEY are required for Moyasar checkout",
    };
  }

  if (secret.startsWith("sk_live_") || publicKey.startsWith("pk_live_")) {
    return {
      ok: false,
      message: "Live Moyasar keys are not allowed — use sandbox test keys only (sk_test_ / pk_test_)",
    };
  }

  if (!secret.startsWith("sk_test_")) {
    return {
      ok: false,
      message: "MOYASAR_SECRET_KEY must be a sandbox test key (sk_test_...)",
    };
  }

  if (!publicKey.startsWith("pk_test_")) {
    return {
      ok: false,
      message: "MOYASAR_PUBLIC_KEY must be a sandbox test key (pk_test_...)",
    };
  }

  return { ok: true };
}

export function isMoyasarSandboxConfigured(): boolean {
  return validateMoyasarSandboxEnv().ok;
}

/** Shared secret for Moyasar webhook `secret_token` / signature verification. */
export function getMoyasarWebhookSecret(): string | null {
  const secret = readEnv(process.env.MOYASAR_WEBHOOK_SECRET);
  if (!secret || PLACEHOLDER_VALUES.has(secret)) return null;
  return secret;
}

export function isMoyasarWebhookConfigured(): boolean {
  return getMoyasarWebhookSecret() !== null;
}
