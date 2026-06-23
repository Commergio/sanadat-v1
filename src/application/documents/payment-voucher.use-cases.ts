import type {
  CreatePaymentInput,
  PaymentVoucher,
  TenantContext,
} from "@/domain";
import type { PaginationModel, PaginatedModel } from "@/application/shared/pagination";
import type { PaymentVoucherRepositoryPort } from "./repository-ports";
import { assertCanCreateOrCancel, assertCanRead } from "./authorization";
import { paymentVoucherInputSchema } from "./schemas";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { TrialDocumentGuard } from "@/application/billing/trial-document-guard";
import type { ActivityLogPort } from "./activity-log.port";

interface PaymentVoucherUseCaseDeps {
  repository: PaymentVoucherRepositoryPort;
  activityLog: ActivityLogPort;
  trialGuard: TrialDocumentGuard;
}

export function buildPaymentVoucherUseCases(deps: PaymentVoucherUseCaseDeps) {
  return {
    async createPaymentVoucher(
      ctx: TenantContext,
      input: CreatePaymentInput
    ): Promise<PaymentVoucher> {
      assertCanCreateOrCancel(ctx);
      await deps.trialGuard.assertCanCreate(ctx);
      const parsed = paymentVoucherInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid payment voucher input", parsed.error.flatten());
      }

      const created = await deps.repository.create(ctx, parsed.data);
      try {
        await deps.activityLog.log(ctx, "document.draft_created", created.id, {
          documentType: "payment_voucher",
        });
      } catch {
        // Activity logging should never block main document flow.
      }
      return created;
    },

    async getPaymentVoucher(
      ctx: TenantContext,
      id: string
    ): Promise<PaymentVoucher> {
      assertCanRead(ctx);
      const found = await deps.repository.getById(ctx, id);
      if (!found) throw new UseCaseError("NOT_FOUND", "Payment voucher not found");
      return found;
    },

    async listPaymentVouchers(
      ctx: TenantContext,
      pagination: PaginationModel
    ): Promise<PaginatedModel<PaymentVoucher>> {
      assertCanRead(ctx);
      return deps.repository.list(ctx, pagination);
    },

    async cancelPaymentVoucher(
      ctx: TenantContext,
      id: string,
      reason: string
    ): Promise<void> {
      assertCanCreateOrCancel(ctx);
      if (!id?.trim()) {
        throw new UseCaseError("VALIDATION", "Payment voucher id is required");
      }
      if (!reason?.trim() || reason.trim().length < 3) {
        throw new UseCaseError("VALIDATION", "Cancel reason must be at least 3 characters");
      }
      try {
        await deps.repository.cancel(ctx, id, reason.trim());
      } catch (error) {
        if (error instanceof UseCaseError) throw error;
        if (error instanceof Error && "code" in error) {
          const code = String((error as { code?: string }).code);
          if (code === "NOT_FOUND" || code === "FORBIDDEN" || code === "VALIDATION" || code === "CONFLICT") {
            throw new UseCaseError(code, error.message);
          }
        }
        throw new UseCaseError("VALIDATION", "Failed to cancel payment voucher");
      }
      try {
        await deps.activityLog.log(ctx, "document.cancelled", id, {
          documentType: "payment_voucher",
          reason: reason.trim(),
        });
      } catch {
        // Activity logging should never block main document flow.
      }
    },
  };
}
