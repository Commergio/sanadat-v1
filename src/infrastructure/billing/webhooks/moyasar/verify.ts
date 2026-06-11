import { createHmac, timingSafeEqual } from "crypto";

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyHmacSignature(rawBody: string, secret: string, signature: string): boolean {
  const digestHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestB64 = createHmac("sha256", secret).update(rawBody).digest("base64");

  const normalized = signature.trim();
  return safeEqualStrings(normalized, digestHex) || safeEqualStrings(normalized, digestB64);
}

/**
 * Moyasar webhook authentication.
 *
 * 1. `x-moyasar-signature` HMAC-SHA256 of the raw body (when present).
 * 2. `secret_token` in the JSON payload (documented by Moyasar).
 *
 * Sandbox deliveries may omit the signature header; `secret_token` is the fallback.
 */
export function verifyMoyasarWebhookRequest(params: {
  rawBody: string;
  payload: Record<string, unknown>;
  signatureHeader: string | null;
  webhookSecret: string;
}): { ok: true } | { ok: false; message: string } {
  const { rawBody, payload, signatureHeader, webhookSecret } = params;

  if (signatureHeader) {
    if (verifyHmacSignature(rawBody, webhookSecret, signatureHeader)) {
      return { ok: true };
    }
  }

  const secretToken = payload.secret_token;
  if (typeof secretToken === "string" && safeEqualStrings(secretToken, webhookSecret)) {
    return { ok: true };
  }

  if (signatureHeader) {
    return {
      ok: false,
      message: "Invalid Moyasar webhook signature or secret_token",
    };
  }

  return {
    ok: false,
    message:
      "Moyasar webhook secret_token mismatch (signature header not present — sandbox limitation)",
  };
}
