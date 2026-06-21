import type { TenantContext } from "@/domain";
import type {
  ApprovePaymentResult,
  PaymentApprovalPayload,
} from "./payment-approval-types";

export interface PaymentApprovalRepositoryPort {
  sendForApproval(
    ctx: TenantContext,
    paymentId: string,
    tokenHash: string,
    expiresAt: Date,
    snapshot: Record<string, unknown>
  ): Promise<{ customerId: string }>;

  getByTokenHash(tokenHash: string): Promise<PaymentApprovalPayload | null>;

  approveByTokenHash(
    tokenHash: string,
    signaturePath: string,
    approvedByName: string | null,
    approvedByPhone: string | null,
    ip: string | null,
    userAgent: string | null
  ): Promise<ApprovePaymentResult>;

  rejectByTokenHash(
    tokenHash: string,
    reason: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<{ paymentId: string; companyId: string }>;
}
