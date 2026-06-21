import type { TenantContext } from "@/domain";
import type {
  ApproveInvoiceResult,
  InvoiceApprovalPayload,
} from "./invoice-approval-types";

export interface InvoiceApprovalRepositoryPort {
  sendForApproval(
    ctx: TenantContext,
    invoiceId: string,
    tokenHash: string,
    expiresAt: Date,
    snapshot: Record<string, unknown>
  ): Promise<{ customerId: string }>;

  getByTokenHash(tokenHash: string): Promise<InvoiceApprovalPayload | null>;

  approveByTokenHash(
    tokenHash: string,
    signaturePath: string,
    approvedByName: string | null,
    approvedByPhone: string | null,
    ip: string | null,
    userAgent: string | null
  ): Promise<ApproveInvoiceResult>;

  rejectByTokenHash(
    tokenHash: string,
    reason: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<{ invoiceId: string; companyId: string }>;
}
