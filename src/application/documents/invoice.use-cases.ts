import type {
  CreateInvoiceInput,
  Invoice,
  TenantContext,
} from "@/domain";
import type { PaginationModel, PaginatedModel } from "@/application/shared/pagination";
import type { InvoiceRepositoryPort } from "./repository-ports";
import { assertCanCreateOrCancel, assertCanRead } from "./authorization";
import { invoiceInputSchema } from "./schemas";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { TrialDocumentGuard } from "@/application/billing/trial-document-guard";
import type { ActivityLogPort } from "./activity-log.port";

interface InvoiceUseCaseDeps {
  repository: InvoiceRepositoryPort;
  activityLog: ActivityLogPort;
  trialGuard: TrialDocumentGuard;
}

export function buildInvoiceUseCases(deps: InvoiceUseCaseDeps) {
  return {
    async createInvoice(
      ctx: TenantContext,
      input: CreateInvoiceInput
    ): Promise<Invoice> {
      assertCanCreateOrCancel(ctx);
      await deps.trialGuard.assertCanCreate(ctx);
      const parsed = invoiceInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invoice input", parsed.error.flatten());
      }

      const created = await deps.repository.create(ctx, parsed.data);
      try {
        await deps.activityLog.log(ctx, "document.draft_created", created.id, {
          documentType: "invoice",
        });
      } catch {
        // Activity logging should never block main document flow.
      }
      return created;
    },

    async getInvoice(
      ctx: TenantContext,
      id: string
    ): Promise<Invoice> {
      assertCanRead(ctx);
      const found = await deps.repository.getById(ctx, id);
      if (!found) throw new UseCaseError("NOT_FOUND", "Invoice not found");
      return found;
    },

    async listInvoices(
      ctx: TenantContext,
      pagination: PaginationModel
    ): Promise<PaginatedModel<Invoice>> {
      assertCanRead(ctx);
      return deps.repository.list(ctx, pagination);
    },

    async cancelInvoice(
      ctx: TenantContext,
      id: string,
      reason: string
    ): Promise<void> {
      assertCanCreateOrCancel(ctx);
      if (!id?.trim()) {
        throw new UseCaseError("VALIDATION", "Invoice id is required");
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
        throw new UseCaseError("VALIDATION", "Failed to cancel invoice");
      }
      try {
        await deps.activityLog.log(ctx, "document.cancelled", id, {
          documentType: "invoice",
          reason: reason.trim(),
        });
      } catch {
        // Activity logging should never block main document flow.
      }
    },
  };
}
