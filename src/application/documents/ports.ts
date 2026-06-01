import type {
  TenantContext,
  PaginatedResult,
  PaginationParams,
  DocumentRegistryEntry,
  DocumentType,
  ReceiptVoucher,
  PaymentVoucher,
  Invoice,
  CreateReceiptInput,
  CreatePaymentInput,
  CreateInvoiceInput,
} from "@/domain";

/** List all documents for dashboard / unified table */
export interface ListDocumentsUseCase {
  execute(
    ctx: TenantContext,
    params: PaginationParams & { type?: DocumentType }
  ): Promise<PaginatedResult<DocumentRegistryEntry>>;
}

export interface GetReceiptUseCase {
  execute(ctx: TenantContext, id: string): Promise<ReceiptVoucher | null>;
}

export interface CreateReceiptUseCase {
  execute(ctx: TenantContext, input: CreateReceiptInput): Promise<ReceiptVoucher>;
}

export interface GetPaymentUseCase {
  execute(ctx: TenantContext, id: string): Promise<PaymentVoucher | null>;
}

export interface CreatePaymentUseCase {
  execute(ctx: TenantContext, input: CreatePaymentInput): Promise<PaymentVoucher>;
}

export interface GetInvoiceUseCase {
  execute(ctx: TenantContext, id: string): Promise<Invoice | null>;
}

export interface CreateInvoiceUseCase {
  execute(ctx: TenantContext, input: CreateInvoiceInput): Promise<Invoice>;
}

export interface CancelDocumentUseCase {
  execute(
    ctx: TenantContext,
    documentId: string,
    reason: string
  ): Promise<void>;
}
