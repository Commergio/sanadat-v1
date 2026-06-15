import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateReceiptInput, ReceiptVoucher } from "@/domain/documents/receipt/entity";
import type { TenantContext } from "@/domain/shared/types";
import type { PaginatedModel, PaginationModel } from "@/application/shared/pagination";
import type { ReceiptRepositoryPort } from "@/application/documents/repository-ports";
import { RepositoryError } from "@/application/shared/errors";
import { mapReceiptVoucher } from "../shared/mappers";
import { applyCursorPagination, finalizePagination } from "../shared/pagination";
import { toRepositoryError } from "../shared/errors";

type ReceiptRow = Record<string, unknown>;

export class SupabaseReceiptRepository implements ReceiptRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(ctx: TenantContext, input: CreateReceiptInput): Promise<ReceiptVoucher> {
    const { data, error } = await this.supabase
      .from("receipt_vouchers")
      .insert({
        company_id: ctx.companyId,
        status: "active",
        lifecycle_status: "draft",
        date: input.date,
        amount: input.amount,
        description: input.description ?? null,
        party_name: input.partyName,
        customer_id: input.customerId,
        payment_method: input.paymentMethod,
        transfer_number: input.transferNumber ?? null,
        bank_name: input.bankName ?? null,
        reference_number: input.referenceNumber ?? null,
        linked_invoice_id: input.linkedInvoiceId ?? null,
        created_by: ctx.userId,
      })
      .select("*")
      .single();

    if (error) throw toRepositoryError(error, "Failed to create receipt voucher");
    return mapReceiptVoucher(data as ReceiptRow);
  }

  async getById(ctx: TenantContext, id: string): Promise<ReceiptVoucher | null> {
    const { data, error } = await this.supabase
      .from("receipt_vouchers")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load receipt voucher");
    if (!data) return null;
    return mapReceiptVoucher(data as ReceiptRow);
  }

  async list(ctx: TenantContext, params: PaginationModel): Promise<PaginatedModel<ReceiptVoucher>> {
    const base = this.supabase
      .from("receipt_vouchers")
      .select("*")
      .eq("company_id", ctx.companyId);
    const { query, limit } = applyCursorPagination(base, params);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, "Failed to list receipt vouchers");
    const { sliced, hasMore, nextCursor } = finalizePagination(data as ReceiptRow[] | null, limit);
    return { items: sliced.map((r) => mapReceiptVoucher(r)), hasMore, nextCursor };
  }

  async cancel(ctx: TenantContext, id: string, reason: string): Promise<void> {
    const { error } = await this.supabase.rpc("cancel_receipt_voucher", {
      p_id: id,
      p_reason: reason,
    });

    if (!error) return;
    const message = (error.message || "").toLowerCase();
    if (error.code === "42501" || message.includes("forbidden")) {
      throw new RepositoryError("FORBIDDEN", "Forbidden to cancel receipt voucher", error);
    }
    if (error.code === "23505" || message.includes("already cancelled")) {
      throw new RepositoryError("CONFLICT", "Receipt voucher already cancelled", error);
    }
    if (message.includes("not found")) {
      throw new RepositoryError("NOT_FOUND", "Receipt voucher not found", error);
    }
    throw new RepositoryError("VALIDATION", "Failed to cancel receipt voucher", error);
  }
}
