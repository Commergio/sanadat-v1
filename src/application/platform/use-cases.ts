import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { PlatformContext } from "@/lib/platform";
import { assertPlatformAdmin, assertPlatformStaff } from "./authorization";
import type { PlatformListQuery } from "./query";
import type { PlatformRepositoryPort } from "./repository-ports";
import {
  addPlatformStaffInputSchema,
  changePlatformStaffRoleInputSchema,
  extendSubscriptionInputSchema,
  setCompanyStatusInputSchema,
} from "./schemas";

function rethrowPlatformError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    const code =
      error.code === "RPC_ERROR"
        ? "RPC_ERROR"
        : error.code === "UNAUTHENTICATED"
          ? "UNAUTHENTICATED"
          : error.code === "CONFLICT"
            ? "CONFLICT"
            : error.code;
    throw new UseCaseError(code as UseCaseError["code"], error.message, error.causeData);
  }
  throw new UseCaseError("RPC_ERROR", fallback);
}

interface PlatformUseCaseDeps {
  repository: PlatformRepositoryPort;
}

export function buildPlatformUseCases(deps: PlatformUseCaseDeps) {
  return {
    async getDashboard(ctx: PlatformContext) {
      assertPlatformStaff(ctx);
      try {
        const stats = await deps.repository.getDashboardStats();
        return { stats };
      } catch (error) {
        rethrowPlatformError(error, "Failed to load platform dashboard");
      }
    },

    async listCompanies(ctx: PlatformContext, query: PlatformListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listCompanies(query);
      } catch (error) {
        rethrowPlatformError(error, "Failed to list companies");
      }
    },

    async getCompany(ctx: PlatformContext, companyId: string) {
      assertPlatformStaff(ctx);
      try {
        const company = await deps.repository.getCompanyById(companyId);
        if (!company) {
          throw new UseCaseError("NOT_FOUND", "Company not found");
        }
        return { company };
      } catch (error) {
        rethrowPlatformError(error, "Failed to load company");
      }
    },

    async setCompanyStatus(ctx: PlatformContext, companyId: string, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = setCompanyStatusInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid status payload", parsed.error.flatten());
      }

      try {
        const result = await deps.repository.setCompanyStatus(
          companyId,
          parsed.data.status,
          parsed.data.reason
        );
        return { result };
      } catch (error) {
        rethrowPlatformError(error, "Failed to update company status");
      }
    },

    async listSubscriptions(ctx: PlatformContext, query: PlatformListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listSubscriptions(query);
      } catch (error) {
        rethrowPlatformError(error, "Failed to list subscriptions");
      }
    },

    async extendSubscription(ctx: PlatformContext, companyId: string, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = extendSubscriptionInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError(
          "VALIDATION",
          "Invalid extend subscription payload",
          parsed.error.flatten()
        );
      }

      const expires = new Date(parsed.data.new_expires_at);
      if (Number.isNaN(expires.getTime())) {
        throw new UseCaseError("VALIDATION", "new_expires_at must be a valid ISO timestamp");
      }
      if (expires.getTime() <= Date.now()) {
        throw new UseCaseError("VALIDATION", "new_expires_at must be in the future");
      }

      try {
        const result = await deps.repository.extendSubscription(
          companyId,
          expires.toISOString(),
          parsed.data.reason
        );
        return { result };
      } catch (error) {
        rethrowPlatformError(error, "Failed to extend subscription");
      }
    },

    async listPayments(ctx: PlatformContext, query: PlatformListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listPayments(query);
      } catch (error) {
        rethrowPlatformError(error, "Failed to list payments");
      }
    },

    async listActions(ctx: PlatformContext, query: PlatformListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listAdminActions(query);
      } catch (error) {
        rethrowPlatformError(error, "Failed to list platform actions");
      }
    },

    async listStaff(ctx: PlatformContext, query: PlatformListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listStaff(query);
      } catch (error) {
        rethrowPlatformError(error, "Failed to list platform staff");
      }
    },

    async addStaff(ctx: PlatformContext, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = addPlatformStaffInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid staff payload", parsed.error.flatten());
      }
      try {
        const staff = await deps.repository.addStaff(
          parsed.data.email.trim().toLowerCase(),
          parsed.data.platform_role
        );
        return { staff };
      } catch (error) {
        rethrowPlatformError(error, "Failed to add platform staff");
      }
    },

    async changeStaffRole(ctx: PlatformContext, profileId: string, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = changePlatformStaffRoleInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid role payload", parsed.error.flatten());
      }
      try {
        const staff = await deps.repository.changeStaffRole(
          profileId,
          parsed.data.platform_role
        );
        return { staff };
      } catch (error) {
        rethrowPlatformError(error, "Failed to change platform staff role");
      }
    },

    async removeStaff(ctx: PlatformContext, profileId: string) {
      assertPlatformAdmin(ctx);
      try {
        const result = await deps.repository.removeStaff(profileId);
        return result;
      } catch (error) {
        rethrowPlatformError(error, "Failed to remove platform staff");
      }
    },
  };
}
