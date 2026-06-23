import type {
  CreateReceiptInput,
  ReceiptVoucher,
  TenantContext,
} from "@/domain";
import type { PaginationModel, PaginatedModel } from "@/application/shared/pagination";
import type { ReceiptRepositoryPort } from "./repository-ports";
import { assertCanCreateOrCancel, assertCanRead } from "./authorization";
import { receiptVoucherInputSchema } from "./schemas";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { TrialDocumentGuard } from "@/application/billing/trial-document-guard";
import type { ActivityLogPort } from "./activity-log.port";

interface ReceiptVoucherUseCaseDeps {
  repository: ReceiptRepositoryPort;
  activityLog: ActivityLogPort;
  trialGuard: TrialDocumentGuard;
}

export function buildReceiptVoucherUseCases(deps: ReceiptVoucherUseCaseDeps) {
  return {
    async createReceiptVoucher(
      ctx: TenantContext,
      input: CreateReceiptInput
    ): Promise<ReceiptVoucher> {
      assertCanCreateOrCancel(ctx);
      await deps.trialGuard.assertCanCreate(ctx);
      const parsed = receiptVoucherInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid receipt voucher input", parsed.error.flatten());
      }

      const created = await deps.repository.create(ctx, parsed.data);
      try {
        await deps.activityLog.log(ctx, "document.draft_created", created.id, {
          documentType: "receipt_voucher",
        });
      } catch {
        // Activity logging should never block main document flow.
      }
      return created;
    },

    async getReceiptVoucher(
      ctx: TenantContext,
      id: string
    ): Promise<ReceiptVoucher> {
      assertCanRead(ctx);
      const found = await deps.repository.getById(ctx, id);
      if (!found) throw new UseCaseError("NOT_FOUND", "Receipt voucher not found");
      return found;
    },

    async listReceiptVouchers(
      ctx: TenantContext,
      pagination: PaginationModel
    ): Promise<PaginatedModel<ReceiptVoucher>> {
      assertCanRead(ctx);
      return deps.repository.list(ctx, pagination);
    },

    async cancelReceiptVoucher(
      ctx: TenantContext,
      id: string,
      reason: string
    ): Promise<void> {
      assertCanCreateOrCancel(ctx);
      if (!id?.trim()) {
        throw new UseCaseError("VALIDATION", "Receipt id is required");
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
        throw new UseCaseError("VALIDATION", "Failed to cancel receipt voucher");
      }
      try {
        await deps.activityLog.log(ctx, "document.cancelled", id, {
          documentType: "receipt_voucher",
          reason: reason.trim(),
        });
      } catch {
        // Activity logging should never block main document flow.
      }
    },
  };
}
