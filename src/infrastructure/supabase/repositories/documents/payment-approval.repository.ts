import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentApprovalRepositoryPort } from "@/application/documents/payment-approval-repository-ports";
import type {
  ApprovePaymentResult,
  PaymentApprovalPayload,
  PaymentApprovalSnapshot,
} from "@/application/documents/payment-approval-types";
import type { TenantContext } from "@/domain";
import { RepositoryError } from "@/application/shared/errors";
import { parseInetIp } from "@/lib/http/client-ip";

type Row = Record<string, unknown>;

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
  if (code === "P0001" || message.includes("not found")) {
    return new RepositoryError("NOT_FOUND", error.message ?? fallback, error);
  }
  return new RepositoryError("VALIDATION", error.message ?? fallback, error);
}

function mapSnapshot(payload: unknown): PaymentApprovalSnapshot {
  const row = (payload ?? {}) as Record<string, unknown>;
  return {
    date: String(row.date ?? ""),
    amount: Number(row.amount ?? 0),
    partyName: String(row.party_name ?? row.partyName ?? ""),
    description: (row.description as string | null) ?? null,
    paymentMethod: (row.payment_method ?? row.paymentMethod ?? "cash") as PaymentApprovalSnapshot["paymentMethod"],
    transferNumber: (row.transfer_number as string | null) ?? null,
    bankName: (row.bank_name as string | null) ?? null,
    referenceNumber: (row.reference_number as string | null) ?? null,
    customerId: String(row.customer_id ?? row.customerId ?? ""),
    customerName: String(row.customer_name ?? row.customerName ?? ""),
    customerPhone: String(row.customer_phone ?? row.customerPhone ?? ""),
  };
}

function mapApprovalPayload(row: Row): PaymentApprovalPayload {
  return {
    paymentId: String(row.payment_id),
    companyId: String(row.company_id),
    companyName: String(row.company_name ?? ""),
    companyNameEn: (row.company_name_en as string | null) ?? null,
    companyPhone: (row.company_phone as string | null) ?? null,
    companyCrNumber: (row.company_cr_number as string | null) ?? null,
    companyVatNumber: (row.company_vat_number as string | null) ?? null,
    companyAddress: (row.company_address as string | null) ?? null,
    customerId: String(row.customer_id ?? ""),
    customerName: String(row.customer_name ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    customerVerified: Boolean(row.customer_verified),
    customerSignaturePath: (row.customer_signature_path as string | null) ?? null,
    lifecycleStatus: String(row.lifecycle_status ?? ""),
    snapshot: mapSnapshot(row.snapshot_payload),
    tokenExpiresAt: (row.token_expires_at as string | null) ?? null,
    tokenUsedAt: (row.token_used_at as string | null) ?? null,
    tokenExpired: Boolean(row.token_expired),
    tokenValid: Boolean(row.token_valid),
  };
}

export class PaymentApprovalRepository implements PaymentApprovalRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async sendForApproval(
    ctx: TenantContext,
    paymentId: string,
    tokenHash: string,
    expiresAt: Date,
    snapshot: Record<string, unknown>
  ): Promise<{ customerId: string }> {
    const { data, error } = await this.supabase.rpc("send_payment_for_approval", {
      p_payment_id: paymentId,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
      p_snapshot: snapshot,
    });

    if (error) throw mapRpcError(error, "Failed to send payment for approval");
    const row = data as Row | null;
    if (!row?.customer_id) {
      throw new RepositoryError("VALIDATION", "Send approval did not return customer id");
    }
    return { customerId: String(row.customer_id) };
  }

  async getByTokenHash(tokenHash: string): Promise<PaymentApprovalPayload | null> {
    const { data, error } = await this.supabase.rpc("get_payment_approval_by_hash", {
      p_token_hash: tokenHash,
    });

    if (error) throw mapRpcError(error, "Failed to load payment approval");
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return mapApprovalPayload(row as Row);
  }

  async approveByTokenHash(
    tokenHash: string,
    signaturePath: string,
    approvedByName: string | null,
    approvedByPhone: string | null,
    ip: string | null,
    userAgent: string | null
  ): Promise<ApprovePaymentResult> {
    const { data, error } = await this.supabase.rpc("approve_payment_by_hash", {
      p_token_hash: tokenHash,
      p_signature_path: signaturePath,
      p_approved_by_name: approvedByName ?? "",
      p_approved_by_phone: approvedByPhone ?? "",
      p_ip: parseInetIp(ip),
      p_user_agent: userAgent ?? "",
    });

    if (error) throw mapRpcError(error, "Failed to approve payment");
    const row = data as Row | null;
    if (!row?.payment_id) {
      throw new RepositoryError("VALIDATION", "Approve did not return payment id");
    }
    return {
      paymentId: String(row.payment_id),
      companyId: String(row.company_id),
      displayNumber: String(row.display_number ?? ""),
    };
  }

  async rejectByTokenHash(
    tokenHash: string,
    reason: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<{ paymentId: string; companyId: string }> {
    const { data, error } = await this.supabase.rpc("reject_payment_by_hash", {
      p_token_hash: tokenHash,
      p_reason: reason,
      p_ip: parseInetIp(ip),
      p_user_agent: userAgent ?? "",
    });

    if (error) throw mapRpcError(error, "Failed to reject payment");
    const row = data as Row | null;
    if (!row?.payment_id) {
      throw new RepositoryError("VALIDATION", "Reject did not return payment id");
    }
    return {
      paymentId: String(row.payment_id),
      companyId: String(row.company_id),
    };
  }
}
