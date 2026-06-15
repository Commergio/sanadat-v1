import type {
  CreateInvoiceInput,
  CreatePaymentInput,
  CreateReceiptInput,
  Invoice,
  PaymentVoucher,
  ReceiptVoucher,
  TenantContext,
} from "@/domain";
import type { PaginatedModel, PaginationModel } from "@/application/shared/pagination";

export interface ReceiptRepositoryPort {
  create(ctx: TenantContext, input: CreateReceiptInput): Promise<ReceiptVoucher>;
  getById(ctx: TenantContext, id: string): Promise<ReceiptVoucher | null>;
  list(ctx: TenantContext, params: PaginationModel): Promise<PaginatedModel<ReceiptVoucher>>;
  cancel(ctx: TenantContext, id: string, reason: string): Promise<void>;
}

export interface PaymentVoucherRepositoryPort {
  create(
    ctx: TenantContext,
    input: CreatePaymentInput,
    allocatedDisplayNumber: string
  ): Promise<PaymentVoucher>;
  getById(ctx: TenantContext, id: string): Promise<PaymentVoucher | null>;
  list(ctx: TenantContext, params: PaginationModel): Promise<PaginatedModel<PaymentVoucher>>;
  cancel(ctx: TenantContext, id: string, reason: string): Promise<void>;
}

export interface InvoiceRepositoryPort {
  create(
    ctx: TenantContext,
    input: CreateInvoiceInput,
    allocatedDisplayNumber: string
  ): Promise<Invoice>;
  getById(ctx: TenantContext, id: string): Promise<Invoice | null>;
  list(ctx: TenantContext, params: PaginationModel): Promise<PaginatedModel<Invoice>>;
  cancel(ctx: TenantContext, id: string, reason: string): Promise<void>;
}

export interface DocumentNumberRepositoryPort {
  nextReceiptNumber(ctx: TenantContext): Promise<string>;
  nextPaymentVoucherNumber(ctx: TenantContext): Promise<string>;
  nextInvoiceNumber(ctx: TenantContext): Promise<string>;
}
