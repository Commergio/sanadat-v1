import type { TenantContext } from "@/lib/tenant";
import type { ManualPaymentRequestModel, ManualPaymentStatus } from "./manual-payment-types";

export interface ManualPaymentRepositoryPort {
  findPendingByCompanyId(companyId: string): Promise<ManualPaymentRequestModel | null>;
  createRequest(
    ctx: TenantContext,
    input: {
      id: string;
      subscriptionId: string | null;
      amount: number;
      currency: string;
      planCode: string;
      billingCycle: "yearly";
      proofFilePath: string;
      couponCode?: string | null;
      couponId?: string | null;
      originalAmount?: number | null;
      discountAmount?: number | null;
    }
  ): Promise<ManualPaymentRequestModel>;
  listForPlatform(input: {
    status?: ManualPaymentStatus;
    limit: number;
    offset: number;
  }): Promise<{ items: ManualPaymentRequestModel[]; total: number }>;
  getByIdForPlatform(id: string): Promise<(ManualPaymentRequestModel & { proofFilePath: string }) | null>;
  getByIdForTenant(ctx: TenantContext, id: string): Promise<ManualPaymentRequestModel | null>;
  markApprovedViaRpc(requestId: string, paymentId: string, adminNote?: string | null): Promise<void>;
  markRejectedViaRpc(requestId: string, adminNote: string): Promise<void>;
}
