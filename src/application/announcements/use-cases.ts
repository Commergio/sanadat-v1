import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { PlatformContext } from "@/lib/platform";
import type { TenantContext } from "@/lib/tenant";
import { assertPlatformAdmin, assertPlatformStaff } from "@/application/platform/authorization";
import type { AnnouncementRepositoryPort, AnnouncementListQuery } from "./repository-ports";
import { createAnnouncementSchema, updateAnnouncementSchema } from "./schemas";

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
  repository: AnnouncementRepositoryPort;
}

export function buildAnnouncementUseCases(deps: Deps) {
  return {
    async listPlatform(ctx: PlatformContext, query: AnnouncementListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listAll(query);
      } catch (error) {
        rethrow(error, "Failed to list announcements");
      }
    },

    async create(ctx: PlatformContext, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = createAnnouncementSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid announcement payload", parsed.error.flatten());
      }
      try {
        return {
          announcement: await deps.repository.create(
            parsed.data as Record<string, unknown>,
            ctx.userId
          ),
        };
      } catch (error) {
        rethrow(error, "Failed to create announcement");
      }
    },

    async update(ctx: PlatformContext, id: string, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = updateAnnouncementSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid announcement payload", parsed.error.flatten());
      }
      if (Object.keys(parsed.data).length === 0) {
        throw new UseCaseError("VALIDATION", "No fields to update");
      }
      try {
        const announcement = await deps.repository.update(
          id,
          parsed.data as Record<string, unknown>,
          ctx.userId
        );
        return { announcement };
      } catch (error) {
        rethrow(error, "Failed to update announcement");
      }
    },

    async remove(ctx: PlatformContext, id: string) {
      assertPlatformAdmin(ctx);
      try {
        await deps.repository.delete(id);
        return { ok: true };
      } catch (error) {
        rethrow(error, "Failed to delete announcement");
      }
    },

    async listForTenant(ctx: TenantContext) {
      try {
        const items = await deps.repository.listForTenant(ctx.companyId, ctx.userId);
        return { items };
      } catch (error) {
        rethrow(error, "Failed to load announcements");
      }
    },

    async markRead(ctx: TenantContext, announcementId: string) {
      try {
        await deps.repository.markRead(announcementId, ctx.companyId, ctx.userId);
        return { ok: true };
      } catch (error) {
        rethrow(error, "Failed to mark announcement as read");
      }
    },
  };
}
