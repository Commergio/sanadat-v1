import type { TenantContext } from "@/domain";
import type {
  ApproveReceiptResult,
  ReceiptApprovalPayload,
} from "./receipt-approval-types";

export interface ReceiptApprovalRepositoryPort {
  sendForApproval(
    ctx: TenantContext,
    receiptId: string,
    tokenHash: string,
    expiresAt: Date,
    snapshot: Record<string, unknown>
  ): Promise<{ customerId: string }>;

  getByTokenHash(tokenHash: string): Promise<ReceiptApprovalPayload | null>;

  approveByTokenHash(
    tokenHash: string,
    signaturePath: string,
    approvedByName: string | null,
    approvedByPhone: string | null,
    ip: string | null,
    userAgent: string | null
  ): Promise<ApproveReceiptResult>;

  rejectByTokenHash(
    tokenHash: string,
    reason: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<{ receiptId: string; companyId: string }>;
}
