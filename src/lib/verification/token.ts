import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;

export function generateVerificationToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const VERIFICATION_TOKEN_TTL_DAYS = 7;

export function verificationExpiresAt(from = new Date()): Date {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + VERIFICATION_TOKEN_TTL_DAYS);
  return expires;
}
