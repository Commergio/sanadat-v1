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

/** Moyasar secret key (`sk_test_...` or `sk_live_...`) — server only. */
export function getMoyasarSecretKey(): string | null {
  const key = readEnv(process.env.MOYASAR_SECRET_KEY);
  if (!key || PLACEHOLDER_VALUES.has(key)) return null;
  return key;
}

/** Moyasar publishable key (`pk_test_...` or `pk_live_...`) — safe for client if needed later. */
export function getMoyasarPublicKey(): string | null {
  const key = readEnv(process.env.MOYASAR_PUBLIC_KEY);
  if (!key || PLACEHOLDER_VALUES.has(key)) return null;
  return key;
}

export type PaymentsMode = "sandbox" | "live";

/**
 * Moyasar payments environment. Defaults to `sandbox` when unset.
 * Set `PAYMENTS_MODE=live` explicitly to allow `sk_live_` / `pk_live_` keys.
 */
export function getPaymentsMode(): PaymentsMode {
  const raw = readEnv(process.env.PAYMENTS_MODE).toLowerCase();
  if (raw === "live") return "live";
  return "sandbox";
}

export interface MoyasarEnvValidation {
  ok: boolean;
  message?: string;
}

type MoyasarKeyKind = "test" | "live" | "invalid";

function classifyMoyasarKey(
  key: string,
  kind: "secret" | "public"
): MoyasarKeyKind {
  const testPrefix = kind === "secret" ? "sk_test_" : "pk_test_";
  const livePrefix = kind === "secret" ? "sk_live_" : "pk_live_";
  if (key.startsWith(testPrefix)) return "test";
  if (key.startsWith(livePrefix)) return "live";
  return "invalid";
}

/**
 * Validates Moyasar keys against PAYMENTS_MODE (sandbox | live).
 * Rejects missing keys, mixed test/live pairs, and live keys without PAYMENTS_MODE=live.
 */
export function validateMoyasarPaymentsEnv(): MoyasarEnvValidation {
  const mode = getPaymentsMode();
  const modeRaw = readEnv(process.env.PAYMENTS_MODE);

  if (modeRaw && modeRaw.toLowerCase() !== "sandbox" && modeRaw.toLowerCase() !== "live") {
    return {
      ok: false,
      message: "PAYMENTS_MODE must be 'sandbox' or 'live'",
    };
  }

  const secret = getMoyasarSecretKey();
  const publicKey = getMoyasarPublicKey();

  if (!secret || !publicKey) {
    return {
      ok: false,
      message: `MOYASAR_SECRET_KEY and MOYASAR_PUBLIC_KEY are required (PAYMENTS_MODE=${mode})`,
    };
  }

  const secretKind = classifyMoyasarKey(secret, "secret");
  const publicKind = classifyMoyasarKey(publicKey, "public");

  if (
    (secretKind === "live" && publicKind === "test") ||
    (secretKind === "test" && publicKind === "live")
  ) {
    return {
      ok: false,
      message:
        "Moyasar keys must match: cannot mix sk_live_ with pk_test_ or sk_test_ with pk_live_",
    };
  }

  if (mode === "sandbox") {
    if (secretKind !== "test") {
      return {
        ok: false,
        message:
          secretKind === "live"
            ? "PAYMENTS_MODE=sandbox does not allow sk_live_ keys — set PAYMENTS_MODE=live for production Moyasar keys"
            : "PAYMENTS_MODE=sandbox requires MOYASAR_SECRET_KEY to start with sk_test_",
      };
    }
    if (publicKind !== "test") {
      return {
        ok: false,
        message:
          publicKind === "live"
            ? "PAYMENTS_MODE=sandbox does not allow pk_live_ keys — set PAYMENTS_MODE=live for production Moyasar keys"
            : "PAYMENTS_MODE=sandbox requires MOYASAR_PUBLIC_KEY to start with pk_test_",
      };
    }
    return { ok: true };
  }

  if (secretKind !== "live") {
    return {
      ok: false,
      message:
        secretKind === "test"
          ? "PAYMENTS_MODE=live requires MOYASAR_SECRET_KEY to start with sk_live_"
          : "PAYMENTS_MODE=live requires MOYASAR_SECRET_KEY to start with sk_live_",
    };
  }
  if (publicKind !== "live") {
    return {
      ok: false,
      message:
        publicKind === "test"
          ? "PAYMENTS_MODE=live requires MOYASAR_PUBLIC_KEY to start with pk_live_"
          : "PAYMENTS_MODE=live requires MOYASAR_PUBLIC_KEY to start with pk_live_",
    };
  }

  return { ok: true };
}

/** @deprecated Use validateMoyasarPaymentsEnv */
export function validateMoyasarSandboxEnv(): MoyasarEnvValidation {
  return validateMoyasarPaymentsEnv();
}

export function isMoyasarPaymentsConfigured(): boolean {
  return validateMoyasarPaymentsEnv().ok;
}

export function isMoyasarSandboxConfigured(): boolean {
  return getPaymentsMode() === "sandbox" && validateMoyasarPaymentsEnv().ok;
}

export function isMoyasarLiveConfigured(): boolean {
  return getPaymentsMode() === "live" && validateMoyasarPaymentsEnv().ok;
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
