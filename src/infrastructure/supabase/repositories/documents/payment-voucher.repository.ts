import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatePaymentInput, PaymentVoucher } from "@/domain/documents/payment/entity";
import type { TenantContext } from "@/domain/shared/types";
import type { PaginatedModel, PaginationModel } from "@/application/shared/pagination";
import type { PaymentVoucherRepositoryPort } from "@/application/documents/repository-ports";
import { RepositoryError } from "@/application/shared/errors";
import { mapPaymentVoucher } from "../shared/mappers";
import { applyCursorPagination, finalizePagination } from "../shared/pagination";
import { toRepositoryError } from "../shared/errors";

type PaymentRow = Record<string, unknown>;

export class SupabasePaymentVoucherRepository implements PaymentVoucherRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(ctx: TenantContext, input: CreatePaymentInput): Promise<PaymentVoucher> {
    const { data, error } = await this.supabase
      .from("payment_vouchers")
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
        created_by: ctx.userId,
      })
      .select("*")
      .single();

    if (error) throw toRepositoryError(error, "Failed to create payment voucher");
    return mapPaymentVoucher(data as PaymentRow);
  }

  async getById(ctx: TenantContext, id: string): Promise<PaymentVoucher | null> {
    const { data, error } = await this.supabase
      .from("payment_vouchers")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load payment voucher");
    if (!data) return null;
    return mapPaymentVoucher(data as PaymentRow);
  }

  async list(ctx: TenantContext, params: PaginationModel): Promise<PaginatedModel<PaymentVoucher>> {
    const base = this.supabase
      .from("payment_vouchers")
      .select("*")
      .eq("company_id", ctx.companyId);
    const { query, limit } = applyCursorPagination(base, params);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, "Failed to list payment vouchers");
    const { sliced, hasMore, nextCursor } = finalizePagination(data as PaymentRow[] | null, limit);
    return { items: sliced.map((r) => mapPaymentVoucher(r)), hasMore, nextCursor };
  }

  async cancel(ctx: TenantContext, id: string, reason: string): Promise<void> {
    const { error } = await this.supabase.rpc("cancel_payment_voucher", {
      p_id: id,
      p_reason: reason,
    });

    if (!error) return;
    const message = (error.message || "").toLowerCase();
    if (error.code === "42501" || message.includes("forbidden")) {
      throw new RepositoryError("FORBIDDEN", "Forbidden to cancel payment voucher", error);
    }
    if (error.code === "23505" || message.includes("already cancelled")) {
      throw new RepositoryError("CONFLICT", "Payment voucher already cancelled", error);
    }
    if (message.includes("not found")) {
      throw new RepositoryError("NOT_FOUND", "Payment voucher not found", error);
    }
    throw new RepositoryError("VALIDATION", "Failed to cancel payment voucher", error);
  }
}
