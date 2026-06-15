import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateInvoiceInput, Invoice } from "@/domain/documents/invoice/entity";
import type { TenantContext } from "@/domain/shared/types";
import type { PaginatedModel, PaginationModel } from "@/application/shared/pagination";
import type { InvoiceRepositoryPort } from "@/application/documents/repository-ports";
import { RepositoryError } from "@/application/shared/errors";
import { mapInvoice, mapInvoiceItem } from "../shared/mappers";
import { applyCursorPagination, finalizePagination } from "../shared/pagination";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

export class SupabaseInvoiceRepository implements InvoiceRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(
    ctx: TenantContext,
    input: CreateInvoiceInput,
    allocatedDisplayNumber: string
  ): Promise<Invoice> {
    const number = Number(allocatedDisplayNumber.split("-").pop() ?? "1");

    const subtotal = input.items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
      0
    );
    const discount = Number(input.discount ?? 0);
    const tax = Number(input.tax ?? 0);
    const total = Math.max(0, subtotal - discount + tax);

    const { data: invoiceRow, error: invoiceError } = await this.supabase
      .from("invoices")
      .insert({
        company_id: ctx.companyId,
        number,
        display_number: allocatedDisplayNumber,
        status: "active",
        lifecycle_status: "issued",
        issued_at: new Date().toISOString(),
        issued_by: ctx.userId,
        date: input.date,
        party_name: input.partyName,
        description: input.description ?? null,
        payment_method: input.paymentMethod,
        transfer_number: input.transferNumber ?? null,
        bank_name: input.bankName ?? null,
        reference_number: input.referenceNumber ?? null,
        subtotal,
        discount,
        tax,
        total,
        amount: total,
        payment_status: "unpaid",
        created_by: ctx.userId,
      })
      .select("*")
      .single();

    if (invoiceError) throw toRepositoryError(invoiceError, "Failed to create invoice");

    const invoiceId = String((invoiceRow as Row).id);
    const payload = input.items.map((item, idx) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      return {
        invoice_id: invoiceId,
        description: item.description,
        quantity,
        unit_price: unitPrice,
        total: quantity * unitPrice,
        sort_order: idx,
      };
    });

    const { data: itemRows, error: itemError } = await this.supabase
      .from("invoice_items")
      .insert(payload)
      .select("*");

    if (itemError) {
      // Best-effort rollback to avoid partial invoice creation if item insert fails.
      await this.supabase.from("invoices").delete().eq("id", invoiceId).eq("company_id", ctx.companyId);
      throw toRepositoryError(itemError, "Failed to create invoice items");
    }
    return mapInvoice(invoiceRow as Row, (itemRows ?? []).map((r) => mapInvoiceItem(r as Row)));
  }

  async getById(ctx: TenantContext, id: string): Promise<Invoice | null> {
    const { data: invoiceRow, error: invoiceError } = await this.supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .maybeSingle();

    if (invoiceError) throw toRepositoryError(invoiceError, "Failed to load invoice");
    if (!invoiceRow) return null;

    const { data: itemRows, error: itemError } = await this.supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true });

    if (itemError) throw toRepositoryError(itemError, "Failed to load invoice items");
    return mapInvoice(invoiceRow as Row, (itemRows ?? []).map((r) => mapInvoiceItem(r as Row)));
  }

  async list(ctx: TenantContext, params: PaginationModel): Promise<PaginatedModel<Invoice>> {
    const base = this.supabase.from("invoices").select("*").eq("company_id", ctx.companyId);
    const { query, limit } = applyCursorPagination(base, params);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, "Failed to list invoices");
    const { sliced, hasMore, nextCursor } = finalizePagination(data as Row[] | null, limit);

    const items = await Promise.all(
      sliced.map(async (row) => {
        const invoiceId = String(row.id);
        const { data: itemRows, error: itemError } = await this.supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("sort_order", { ascending: true });
        if (itemError) throw toRepositoryError(itemError, "Failed to load invoice items");
        return mapInvoice(row, (itemRows ?? []).map((r) => mapInvoiceItem(r as Row)));
      })
    );

    return { items, hasMore, nextCursor };
  }

  async cancel(ctx: TenantContext, id: string, reason: string): Promise<void> {
    const { error } = await this.supabase.rpc("cancel_invoice", {
      p_id: id,
      p_reason: reason,
    });

    if (!error) return;
    const message = (error.message || "").toLowerCase();
    if (error.code === "42501" || message.includes("forbidden")) {
      throw new RepositoryError("FORBIDDEN", "Forbidden to cancel invoice", error);
    }
    if (error.code === "23505" || message.includes("already cancelled")) {
      throw new RepositoryError("CONFLICT", "Invoice already cancelled", error);
    }
    if (message.includes("not found")) {
      throw new RepositoryError("NOT_FOUND", "Invoice not found", error);
    }
    throw new RepositoryError("VALIDATION", "Failed to cancel invoice", error);
  }
}
