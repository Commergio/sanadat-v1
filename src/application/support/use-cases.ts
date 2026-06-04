import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { assertPlatformStaff } from "@/application/platform/authorization";
import type { PlatformContext } from "@/lib/platform";
import type { TenantContext } from "@/lib/tenant";
import type { SupportRepositoryPort } from "./repository-ports";
import type { SupportTicketListQuery } from "./query";
import { addNoteSchema, createTicketSchema, updateTicketSchema } from "./schemas";

function rethrow(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(
      error.code === "NOT_FOUND" ? "NOT_FOUND" : "RPC_ERROR",
      error.message,
      error.causeData
    );
  }
  throw new UseCaseError("RPC_ERROR", fallback);
}

interface Deps {
  repository: SupportRepositoryPort;
}

export function buildSupportUseCases(deps: Deps) {
  return {
    async listTenant(ctx: TenantContext, query: SupportTicketListQuery) {
      try {
        return await deps.repository.listForCompany(ctx.companyId, query);
      } catch (error) {
        rethrow(error, "Failed to list support tickets");
      }
    },

    async getTenant(ctx: TenantContext, ticketId: string) {
      try {
        const detail = await deps.repository.getForCompany(
          ctx.companyId,
          ticketId,
          false
        );
        if (!detail) {
          throw new UseCaseError("NOT_FOUND", "Support ticket not found");
        }
        return detail;
      } catch (error) {
        rethrow(error, "Failed to load support ticket");
      }
    },

    async createTenant(ctx: TenantContext, input: unknown) {
      const parsed = createTicketSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid ticket payload", parsed.error.flatten());
      }
      try {
        const ticket = await deps.repository.createTicket(
          ctx.companyId,
          ctx.userId,
          parsed.data as Record<string, unknown>
        );
        return { ticket };
      } catch (error) {
        rethrow(error, "Failed to create support ticket");
      }
    },

    async addTenantNote(ctx: TenantContext, ticketId: string, input: unknown) {
      const parsed = addNoteSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid note payload", parsed.error.flatten());
      }
      try {
        const detail = await deps.repository.getForCompany(ctx.companyId, ticketId, false);
        if (!detail) {
          throw new UseCaseError("NOT_FOUND", "Support ticket not found");
        }
        const note = await deps.repository.addNote(
          ticketId,
          ctx.userId,
          parsed.data.body,
          false
        );
        return { note };
      } catch (error) {
        rethrow(error, "Failed to add reply");
      }
    },

    async listPlatform(ctx: PlatformContext, query: SupportTicketListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listAll(query);
      } catch (error) {
        rethrow(error, "Failed to list support tickets");
      }
    },

    async getPlatform(ctx: PlatformContext, ticketId: string) {
      assertPlatformStaff(ctx);
      try {
        const detail = await deps.repository.getById(ticketId);
        if (!detail) {
          throw new UseCaseError("NOT_FOUND", "Support ticket not found");
        }
        return detail;
      } catch (error) {
        rethrow(error, "Failed to load support ticket");
      }
    },

    async updatePlatform(ctx: PlatformContext, ticketId: string, input: unknown) {
      assertPlatformStaff(ctx);
      const parsed = updateTicketSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid update payload", parsed.error.flatten());
      }
      try {
        const ticket = await deps.repository.updateTicket(
          ticketId,
          parsed.data as Record<string, unknown>,
          ctx.userId
        );
        return { ticket };
      } catch (error) {
        rethrow(error, "Failed to update support ticket");
      }
    },

    async addPlatformNote(ctx: PlatformContext, ticketId: string, input: unknown) {
      assertPlatformStaff(ctx);
      const parsed = addNoteSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid note payload", parsed.error.flatten());
      }
      try {
        const note = await deps.repository.addNote(
          ticketId,
          ctx.userId,
          parsed.data.body,
          parsed.data.internal_only ?? false
        );
        return { note };
      } catch (error) {
        rethrow(error, "Failed to add note");
      }
    },
  };
}
