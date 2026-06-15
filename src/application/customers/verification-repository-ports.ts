import type { CustomerVerificationPayload, SendCustomerVerificationResult } from "./verification-types";
import type { TenantContext } from "@/domain";

export interface CustomerVerificationRepositoryPort {
  storeVerificationToken(
    ctx: TenantContext,
    customerId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void>;

  getVerificationByTokenHash(tokenHash: string): Promise<CustomerVerificationPayload | null>;

  completeVerification(
    tokenHash: string,
    signaturePath: string,
    ip: string | null,
    userAgent: string | null
  ): Promise<string>;
}
