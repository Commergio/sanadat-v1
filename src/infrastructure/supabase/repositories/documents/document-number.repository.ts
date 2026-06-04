import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/domain/shared/types";
import type { DocumentType } from "@/domain/documents/shared/types";
import { getDocumentTypeDefinition } from "@/domain/documents/shared/types";
import { RepositoryError } from "@/application/shared/errors";
import type { DocumentNumberRepositoryPort } from "@/application/documents/repository-ports";

interface NumberRow {
  number: number;
  display_number: string;
}

export class DocumentNumberRepository implements DocumentNumberRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async nextByType(ctx: TenantContext, type: DocumentType): Promise<string> {
    const def = getDocumentTypeDefinition(type);
    const { data, error } = await this.supabase.rpc("get_next_document_number", {
      p_company_id: ctx.companyId,
      p_type: type,
      p_prefix: def.prefixAr,
    });

    if (error) {
      throw new RepositoryError("VALIDATION", error.message);
    }

    const rows = (data ?? []) as NumberRow[];
    const first = rows[0];
    if (!first?.display_number) {
      throw new RepositoryError("VALIDATION", "Failed to allocate document number");
    }
    return first.display_number;
  }

  async nextReceiptNumber(ctx: TenantContext): Promise<string> {
    return this.nextByType(ctx, "receipt_voucher");
  }

  async nextPaymentVoucherNumber(ctx: TenantContext): Promise<string> {
    return this.nextByType(ctx, "payment_voucher");
  }

  async nextInvoiceNumber(ctx: TenantContext): Promise<string> {
    return this.nextByType(ctx, "invoice");
  }
}
