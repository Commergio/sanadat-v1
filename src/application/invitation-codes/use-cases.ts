import type { ActivityLogPort } from "@/application/documents";
import type { BillingRepositoryPort } from "@/application/billing/repository-ports";
import { notifyAccountActivated } from "@/application/notifications/account-activated";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { assertPlatformAdmin, assertPlatformStaff } from "@/application/platform/authorization";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { PlatformContext } from "@/lib/platform";
import type { TenantContext } from "@/lib/tenant";
import { hasMinimumTenantRole } from "@/lib/tenant";
import {
  createInvitationCodeSchema,
  updateInvitationCodeSchema,
  applyInvitationCodeSchema,
} from "./schemas";
import type { InvitationCodeRepositoryPort } from "./repository-ports";
import { computePromoAccessPeriod } from "./promo-period";
import {
  normalizeInvitationCode,
  validateInvitationPromoForRedemption,
} from "./validate-promo";
import type {
  ApplyInvitationCodeResult,
  InvitationCodeListQuery,
} from "./types";

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

function assertCanApplyInvitationCode(ctx: TenantContext): void {
  if (!hasMinimumTenantRole(ctx.role, "admin")) {
    throw new UseCaseError(
      "FORBIDDEN",
      "Insufficient role. owner/admin required to apply invitation codes."
    );
  }
}

interface Deps {
  repository: InvitationCodeRepositoryPort;
  billingRepository: BillingRepositoryPort;
  activityLog?: ActivityLogPort;
}

export function buildInvitationCodeUseCases(deps: Deps) {
  return {
    async listPlatform(ctx: PlatformContext, query: InvitationCodeListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listAll(query);
      } catch (error) {
        rethrow(error, "Failed to list invitation codes");
      }
    },

    async create(ctx: PlatformContext, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = createInvitationCodeSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invitation code payload", parsed.error.flatten());
      }
      try {
        const promo = await deps.repository.create(
          parsed.data as Record<string, unknown>,
          ctx.userId
        );
        await deps.repository.logAdminAction("invitation_code.created", promo.id, {
          code: promo.code,
        });
        return { promo };
      } catch (error) {
        rethrow(error, "Failed to create invitation code");
      }
    },

    async update(ctx: PlatformContext, id: string, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = updateInvitationCodeSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invitation code payload", parsed.error.flatten());
      }
      if (Object.keys(parsed.data).length === 0) {
        throw new UseCaseError("VALIDATION", "No fields to update");
      }
      try {
        const promo = await deps.repository.update(
          id,
          parsed.data as Record<string, unknown>,
          ctx.userId
        );
        await deps.repository.logAdminAction("invitation_code.updated", promo.id, {
          code: promo.code,
        });
        return { promo };
      } catch (error) {
        rethrow(error, "Failed to update invitation code");
      }
    },

    async remove(ctx: PlatformContext, id: string) {
      assertPlatformAdmin(ctx);
      try {
        const existing = await deps.repository.getById(id);
        if (!existing) {
          throw new UseCaseError("NOT_FOUND", "Invitation code not found");
        }
        await deps.repository.delete(id);
        await deps.repository.logAdminAction("invitation_code.deleted", id, {
          code: existing.code,
        });
        return { ok: true };
      } catch (error) {
        rethrow(error, "Failed to delete invitation code");
      }
    },

    async applyForTenant(
      ctx: TenantContext,
      input: unknown
    ): Promise<ApplyInvitationCodeResult> {
      assertCanApplyInvitationCode(ctx);
      const parsed = applyInvitationCodeSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invitation code", parsed.error.flatten());
      }

      const normalizedCode = normalizeInvitationCode(parsed.data.code);

      try {
        const promo = await deps.repository.getByCode(normalizedCode);
        if (!promo) {
          throw new UseCaseError("NOT_FOUND", "Invitation code not found");
        }

        const [totalRedemptionCount, companyRedemptionCount] = await Promise.all([
          deps.repository.countRedemptions(promo.id),
          deps.repository.countCompanyRedemptions(promo.id, ctx.companyId),
        ]);

        const validation = validateInvitationPromoForRedemption({
          promo,
          totalRedemptionCount,
          companyRedemptionCount,
        });

        if (!validation.valid) {
          const code =
            validation.message.includes("expired")
              ? "VALIDATION"
              : validation.message.includes("already used")
                ? "CONFLICT"
                : validation.message.includes("redemption limit")
                  ? "CONFLICT"
                  : "VALIDATION";
          throw new UseCaseError(code, validation.message);
        }

        const subscription = await deps.billingRepository.getSubscriptionByCompanyId(ctx.companyId);
        if (!subscription) {
          throw new UseCaseError("NOT_FOUND", "Subscription not found for company");
        }

        const period = computePromoAccessPeriod(subscription, promo.durationDays);

        await deps.billingRepository.activatePromoSubscription({
          subscriptionId: subscription.id,
          companyId: ctx.companyId,
          planCode: "sanadat_annual",
          amount: SUBSCRIPTION_PRICE,
          startsAt: period.startsAt,
          expiresAt: period.expiresAt,
        });

        await deps.repository.createRedemption({
          promoCodeId: promo.id,
          companyId: ctx.companyId,
          redeemedBy: ctx.userId,
          subscriptionId: subscription.id,
          grantedDays: promo.durationDays,
          startsAt: period.startsAt,
          expiresAt: period.expiresAt,
        });

        if (deps.activityLog) {
          try {
            await deps.activityLog.log(
              {
                userId: ctx.userId,
                companyId: ctx.companyId,
                role: ctx.role,
              },
              "promo_code.applied",
              promo.id,
              {
                entityType: "invitation_promo_code",
                code: promo.code,
                grantedDays: promo.durationDays,
                expiresAt: period.expiresAt,
              }
            );
          } catch {
            // non-blocking
          }
        }

        void notifyAccountActivated({
          companyId: ctx.companyId,
          expiresAt: period.expiresAt,
        });

        return {
          success: true,
          code: promo.code,
          grantedDays: promo.durationDays,
          startsAt: period.startsAt,
          expiresAt: period.expiresAt,
          subscriptionStatus: "active",
          subscriptionSource: "promo",
        };
      } catch (error) {
        rethrow(error, "Failed to apply invitation code");
      }
    },

    async listRedemptionsForCompany(companyId: string) {
      try {
        return await deps.repository.listRedemptionsByCompany(companyId);
      } catch (error) {
        rethrow(error, "Failed to load promo redemptions");
      }
    },
  };
}
