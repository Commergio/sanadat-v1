import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceApprovalRepositoryPort } from "@/application/documents/invoice-approval-repository-ports";
import type {
  ApproveInvoiceResult,
  InvoiceApprovalPayload,
  InvoiceApprovalSnapshot,
  InvoiceApprovalSnapshotItem,
} from "@/application/documents/invoice-approval-types";
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

function mapSnapshotItem(row: Record<string, unknown>, index: number): InvoiceApprovalSnapshotItem {
  return {
    description: String(row.description ?? ""),
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? row.unitPrice ?? 0),
    total: Number(row.total ?? 0),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? index),
  };
}

function mapSnapshot(payload: unknown): InvoiceApprovalSnapshot {
  const row = (payload ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items = rawItems.map((item, index) =>
    mapSnapshotItem((item ?? {}) as Record<string, unknown>, index)
  );

  return {
    date: String(row.date ?? ""),
    partyName: String(row.party_name ?? row.partyName ?? ""),
    description: (row.description as string | null) ?? null,
    paymentMethod: (row.payment_method ?? row.paymentMethod ?? "cash") as InvoiceApprovalSnapshot["paymentMethod"],
    transferNumber: (row.transfer_number as string | null) ?? null,
    bankName: (row.bank_name as string | null) ?? null,
    referenceNumber: (row.reference_number as string | null) ?? null,
    customerId: String(row.customer_id ?? row.customerId ?? ""),
    customerName: String(row.customer_name ?? row.customerName ?? ""),
    customerPhone: String(row.customer_phone ?? row.customerPhone ?? ""),
    items,
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
  };
}

function mapApprovalPayload(row: Row): InvoiceApprovalPayload {
  return {
    invoiceId: String(row.invoice_id),
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

export class InvoiceApprovalRepository implements InvoiceApprovalRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async sendForApproval(
    ctx: TenantContext,
    invoiceId: string,
    tokenHash: string,
    expiresAt: Date,
    snapshot: Record<string, unknown>
  ): Promise<{ customerId: string }> {
    const { data, error } = await this.supabase.rpc("send_invoice_for_approval", {
      p_invoice_id: invoiceId,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
      p_snapshot: snapshot,
    });

    if (error) throw mapRpcError(error, "Failed to send invoice for approval");
    const row = data as Row | null;
    if (!row?.customer_id) {
      throw new RepositoryError("VALIDATION", "Send approval did not return customer id");
    }
    return { customerId: String(row.customer_id) };
  }

  async getByTokenHash(tokenHash: string): Promise<InvoiceApprovalPayload | null> {
    const { data, error } = await this.supabase.rpc("get_invoice_approval_by_hash", {
      p_token_hash: tokenHash,
    });

    if (error) throw mapRpcError(error, "Failed to load invoice approval");
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
  ): Promise<ApproveInvoiceResult> {
    const { data, error } = await this.supabase.rpc("approve_invoice_by_hash", {
      p_token_hash: tokenHash,
      p_signature_path: signaturePath,
      p_approved_by_name: approvedByName ?? "",
      p_approved_by_phone: approvedByPhone ?? "",
      p_ip: parseInetIp(ip),
      p_user_agent: userAgent ?? "",
    });

    if (error) throw mapRpcError(error, "Failed to approve invoice");
    const row = data as Row | null;
    if (!row?.invoice_id) {
      throw new RepositoryError("VALIDATION", "Approve did not return invoice id");
    }
    return {
      invoiceId: String(row.invoice_id),
      companyId: String(row.company_id),
      displayNumber: String(row.display_number ?? ""),
    };
  }

  async rejectByTokenHash(
    tokenHash: string,
    reason: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<{ invoiceId: string; companyId: string }> {
    const { data, error } = await this.supabase.rpc("reject_invoice_by_hash", {
      p_token_hash: tokenHash,
      p_reason: reason,
      p_ip: parseInetIp(ip),
      p_user_agent: userAgent ?? "",
    });

    if (error) throw mapRpcError(error, "Failed to reject invoice");
    const row = data as Row | null;
    if (!row?.invoice_id) {
      throw new RepositoryError("VALIDATION", "Reject did not return invoice id");
    }
    return {
      invoiceId: String(row.invoice_id),
      companyId: String(row.company_id),
    };
  }
}
