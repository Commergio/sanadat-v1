import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "payment-proofs";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export function paymentProofPath(companyId: string, requestId: string, ext: string): string {
  return `${companyId}/${requestId}/proof.${ext}`;
}

function extensionForContentType(contentType: string): string {
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/png") return "png";
  return "jpg";
}

export function validatePaymentProofFile(
  buffer: Buffer,
  contentType: string
): "invalid_format" | "max_size" | null {
  if (!ALLOWED_TYPES.has(contentType)) return "invalid_format";
  if (buffer.length > MAX_SIZE_BYTES) return "max_size";
  if (buffer.length < 50) return "invalid_format";
  return null;
}

export function newManualPaymentRequestId(): string {
  return randomUUID();
}

export async function uploadPaymentProof(
  supabase: SupabaseClient,
  companyId: string,
  requestId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const validation = validatePaymentProofFile(buffer, contentType);
  if (validation) throw new Error(validation);

  const ext = extensionForContentType(contentType);
  const path = paymentProofPath(companyId, requestId, ext);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: false,
    contentType,
    cacheControl: "3600",
  });

  if (error) throw error;
  return path;
}

export async function createPaymentProofSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!path?.trim()) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
