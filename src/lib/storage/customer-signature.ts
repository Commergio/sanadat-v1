import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "document-signatures";
const MAX_SIZE_BYTES = 512 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function customerSignaturePath(companyId: string, customerId: string): string {
  return `${companyId}/customers/${customerId}/default-signature.png`;
}

export function validateSignatureFile(
  buffer: Buffer,
  contentType: string
): "invalid_format" | "max_size" | null {
  if (!ALLOWED_TYPES.has(contentType)) return "invalid_format";
  if (buffer.length > MAX_SIZE_BYTES) return "max_size";
  if (buffer.length < 100) return "invalid_format";
  return null;
}

export function receiptApprovalSignaturePath(companyId: string, receiptId: string): string {
  return `${companyId}/receipts/${receiptId}/approval-signature.png`;
}

export function paymentApprovalSignaturePath(companyId: string, paymentId: string): string {
  return `${companyId}/payments/${paymentId}/approval-signature.png`;
}

export async function uploadPaymentApprovalSignature(
  supabase: SupabaseClient,
  companyId: string,
  paymentId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const validation = validateSignatureFile(buffer, contentType);
  if (validation) throw new Error(validation);

  const path = paymentApprovalSignaturePath(companyId, paymentId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) throw error;
  return path;
}

export async function uploadReceiptApprovalSignature(
  supabase: SupabaseClient,
  companyId: string,
  receiptId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const validation = validateSignatureFile(buffer, contentType);
  if (validation) throw new Error(validation);

  const path = receiptApprovalSignaturePath(companyId, receiptId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) throw error;
  return path;
}

export async function uploadCustomerSignature(
  supabase: SupabaseClient,
  companyId: string,
  customerId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const validation = validateSignatureFile(buffer, contentType);
  if (validation) throw new Error(validation);

  const path = customerSignaturePath(companyId, customerId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) throw error;
  return path;
}

export async function createCustomerSignatureSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
