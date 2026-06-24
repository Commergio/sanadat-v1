import { resolvePlanPrice } from "@/application/billing/constants";
import { assertCanReadBilling } from "@/application/billing/authorization";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { PlatformContext } from "@/lib/platform";
import type { TenantContext } from "@/lib/tenant";
import { assertPlatformAdmin, assertPlatformStaff } from "@/application/platform/authorization";
import {
  normalizeCouponCode,
  validateCouponForCheckout,
} from "./calculate-discount";
import type { CouponRepositoryPort } from "./repository-ports";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponInputSchema,
} from "./schemas";
import type {
  CouponDiscountBreakdown,
  CouponListQuery,
  CouponValidationResult,
  ValidateCouponInput,
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

interface Deps {
  repository: CouponRepositoryPort;
}

export function toValidateCouponResponse(result: CouponValidationResult, planAmount?: number) {
  if (!result.valid) {
    return {
      valid: false as const,
      coupon_code: null,
      discount_type: null,
      discount_value: null,
      original_amount: planAmount ?? null,
      discount_amount: null,
      final_amount: null,
      message: result.message,
    };
  }

  return {
    valid: true as const,
    coupon_code: result.couponCode,
    discount_type: result.discountType,
    discount_value: result.discountValue,
    original_amount: result.originalAmount,
    discount_amount: result.discountAmount,
    final_amount: result.finalAmount,
    message: result.message,
  };
}

export function buildCouponUseCases(deps: Deps) {
  async function resolveCheckoutValidation(
    ctx: TenantContext,
    input: ValidateCouponInput
  ): Promise<CouponValidationResult> {
    const plan = resolvePlanPrice(input.planCode);
    if (!plan) {
      return { valid: false, message: "Unknown plan_code" };
    }

    if (input.billingCycle !== plan.billingCycle) {
      return { valid: false, message: "Only yearly billing_cycle is supported" };
    }

    const normalizedCode = normalizeCouponCode(input.code);
    const coupon = await deps.repository.getByCode(normalizedCode);
    if (!coupon) {
      return { valid: false, message: "Coupon not found" };
    }

    const [totalRedemptionCount, companyRedemptionCount] = await Promise.all([
      deps.repository.countActiveRedemptions(coupon.id),
      deps.repository.countCompanyActiveRedemptions(coupon.id, ctx.companyId),
    ]);

    return validateCouponForCheckout({
      coupon,
      originalAmount: plan.amount,
      currency: plan.currency,
      totalRedemptionCount,
      companyRedemptionCount,
    });
  }

  return {
    async listPlatform(ctx: PlatformContext, query: CouponListQuery) {
      assertPlatformStaff(ctx);
      try {
        return await deps.repository.listAll(query);
      } catch (error) {
        rethrow(error, "Failed to list coupons");
      }
    },

    async create(ctx: PlatformContext, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = createCouponSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid coupon payload", parsed.error.flatten());
      }
      try {
        const coupon = await deps.repository.create(
          parsed.data as Record<string, unknown>,
          ctx.userId
        );
        await deps.repository.logAdminAction("coupon.created", coupon.id, {
          code: coupon.code,
        });
        return { coupon };
      } catch (error) {
        rethrow(error, "Failed to create coupon");
      }
    },

    async update(ctx: PlatformContext, id: string, input: unknown) {
      assertPlatformAdmin(ctx);
      const parsed = updateCouponSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid coupon payload", parsed.error.flatten());
      }
      if (Object.keys(parsed.data).length === 0) {
        throw new UseCaseError("VALIDATION", "No fields to update");
      }
      try {
        const coupon = await deps.repository.update(
          id,
          parsed.data as Record<string, unknown>,
          ctx.userId
        );
        await deps.repository.logAdminAction("coupon.updated", coupon.id, {
          code: coupon.code,
        });
        return { coupon };
      } catch (error) {
        rethrow(error, "Failed to update coupon");
      }
    },

    async remove(ctx: PlatformContext, id: string) {
      assertPlatformAdmin(ctx);
      try {
        const existing = await deps.repository.getById(id);
        if (!existing) {
          throw new UseCaseError("NOT_FOUND", "Coupon not found");
        }
        await deps.repository.delete(id);
        await deps.repository.logAdminAction("coupon.deleted", id, {
          code: existing.code,
        });
        return { ok: true };
      } catch (error) {
        rethrow(error, "Failed to delete coupon");
      }
    },

    async validateForCheckout(ctx: TenantContext, input: unknown) {
      assertCanReadBilling(ctx);
      const parsed = validateCouponInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid coupon validation input", parsed.error.flatten());
      }
      try {
        return await resolveCheckoutValidation(ctx, {
          code: parsed.data.code,
          planCode: parsed.data.plan_code,
          billingCycle: parsed.data.billing_cycle,
        });
      } catch (error) {
        rethrow(error, "Failed to validate coupon");
      }
    },

    async validateForCheckoutByCode(
      ctx: TenantContext,
      params: {
        code: string;
        planCode: string;
        billingCycle: "yearly";
      }
    ): Promise<CouponDiscountBreakdown> {
      const result = await resolveCheckoutValidation(ctx, {
        code: params.code,
        planCode: params.planCode,
        billingCycle: params.billingCycle,
      });
      if (!result.valid) {
        throw new UseCaseError("VALIDATION", result.message);
      }
      return result;
    },

    async recordCheckoutRedemption(
      ctx: TenantContext,
      breakdown: CouponDiscountBreakdown,
      paymentId: string,
      subscriptionId: string | null
    ): Promise<void> {
      await this.recordRedemptionForPayment({
        companyId: ctx.companyId,
        redeemedBy: ctx.userId,
        breakdown,
        paymentId,
        subscriptionId,
      });
    },

    async recordRedemptionForPayment(input: {
      companyId: string;
      redeemedBy: string;
      breakdown: CouponDiscountBreakdown;
      paymentId: string;
      subscriptionId: string | null;
    }): Promise<void> {
      await deps.repository.createRedemption({
        couponId: input.breakdown.couponId,
        companyId: input.companyId,
        paymentId: input.paymentId,
        subscriptionId: input.subscriptionId,
        redeemedBy: input.redeemedBy,
        originalAmount: input.breakdown.originalAmount,
        discountAmount: input.breakdown.discountAmount,
        finalAmount: input.breakdown.finalAmount,
      });
    },
  };
}
