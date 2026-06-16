import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerVerificationRepositoryPort } from "@/application/customers/verification-repository-ports";
import type { CustomerVerificationPayload } from "@/application/customers/verification-types";
import type { TenantContext } from "@/domain";
import { RepositoryError } from "@/application/shared/errors";
import { parseInetIp } from "@/lib/http/client-ip";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

function mapVerificationPayload(row: Row): CustomerVerificationPayload {
  return {
    customerId: String(row.customer_id),
    companyId: String(row.company_id),
    companyName: String(row.company_name),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    isVerified: Boolean(row.is_verified),
    tokenValid: Boolean(row.token_valid),
    tokenExpired: Boolean(row.token_expired),
    tokenUsed: Boolean(row.token_used),
  };
}

function mapRpcError(error: { code?: string; message?: string }, fallback: string): RepositoryError {
  const code = error.code ?? "";
  const message = (error.message ?? fallback).toLowerCase();

  if (code === "42501" || message.includes("forbidden")) {
    return new RepositoryError("FORBIDDEN", error.message ?? fallback, error);
  }
  if (code === "P0002" || message.includes("expired")) {
    return new RepositoryError("EXPIRED", error.message ?? fallback, error);
  }
  if (code === "23505" || message.includes("already")) {
    return new RepositoryError("CONFLICT", error.message ?? fallback, error);
  }
  if (code === "P0001" || message.includes("not found") || message.includes("invalid")) {
    return new RepositoryError("NOT_FOUND", error.message ?? fallback, error);
  }
  return new RepositoryError("VALIDATION", error.message ?? fallback, error);
}

export class CustomerVerificationRepository implements CustomerVerificationRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async storeVerificationToken(
    ctx: TenantContext,
    customerId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    const { error } = await this.supabase.rpc("store_customer_verification_token", {
      p_customer_id: customerId,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
    });

    if (error) throw mapRpcError(error, "Failed to store verification token");
  }

  async getVerificationByTokenHash(tokenHash: string): Promise<CustomerVerificationPayload | null> {
    const { data, error } = await this.supabase.rpc("get_customer_verification_by_hash", {
      p_token_hash: tokenHash,
    });

    if (error) throw mapRpcError(error, "Failed to load verification");
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return mapVerificationPayload(row as Row);
  }

  async completeVerification(
    tokenHash: string,
    signaturePath: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc("complete_customer_verification", {
      p_token_hash: tokenHash,
      p_signature_path: signaturePath,
      p_ip: parseInetIp(ip),
      p_user_agent: userAgent,
    });

    if (error) throw mapRpcError(error, "Failed to complete verification");
    if (!data) throw new RepositoryError("VALIDATION", "Verification did not return customer id");
    return String(data);
  }
}
