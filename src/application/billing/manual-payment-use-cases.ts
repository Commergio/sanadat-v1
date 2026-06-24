import type { ActivityLogPort } from "@/application/documents";
import type { CouponDiscountBreakdown } from "@/application/coupons/types";
import type { buildCouponUseCases } from "@/application/coupons/use-cases";
import { notifyAccountActivated } from "@/application/notifications/account-activated";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import type { PlatformContext } from "@/lib/platform";
import { hasMinimumTenantRole } from "@/lib/tenant";
import type { TenantContext } from "@/lib/tenant";
import { resolvePlanPrice } from "./constants";
import { computeYearlyBillingPeriod } from "./period";
import type { BillingRepositoryPort } from "./repository-ports";
import type { ManualPaymentRepositoryPort } from "./manual-payment-repository-ports";
import type {
  ApproveManualPaymentResult,
  ManualPaymentRequestModel,
  ManualPaymentStatus,
  RejectManualPaymentResult,
  SubmitManualPaymentResult,
} from "./manual-payment-types";
import {
  newManualPaymentRequestId,
  uploadPaymentProof,
} from "@/lib/storage/payment-proof";
import type { SupabaseClient } from "@supabase/supabase-js";

function rethrowManualPaymentError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

function assertCanSubmitManualPayment(ctx: TenantContext): void {
  if (!hasMinimumTenantRole(ctx.role, "admin")) {
    throw new UseCaseError(
      "FORBIDDEN",
      "Insufficient role. owner/admin required to submit bank transfer proof."
    );
  }
}

type CouponCheckoutService = ReturnType<typeof buildCouponUseCases>;

export function buildManualPaymentUseCases(deps: {
  manualPaymentRepository: ManualPaymentRepositoryPort;
  billingRepository: BillingRepositoryPort;
  activityLog?: ActivityLogPort;
  serviceRoleClient: SupabaseClient;
  coupons?: CouponCheckoutService;
}) {
  return {
    async getTenantPendingRequest(ctx: TenantContext): Promise<ManualPaymentRequestModel | null> {
      try {
        return await deps.manualPaymentRepository.findPendingByCompanyId(ctx.companyId);
      } catch (error) {
        rethrowManualPaymentError(error, "Failed to load manual payment request");
      }
    },

    async submitManualPayment(
      ctx: TenantContext,
      input: {
        planCode: string;
        billingCycle: "yearly";
        amount: number;
        currency: string;
        proofBuffer: Buffer;
        proofContentType: string;
        couponCode?: string | null;
      }
    ): Promise<SubmitManualPaymentResult> {
      assertCanSubmitManualPayment(ctx);

      const plan = resolvePlanPrice(input.planCode);
      if (!plan) {
        throw new UseCaseError("VALIDATION", "Unknown plan_code");
      }
      if (input.billingCycle !== plan.billingCycle) {
        throw new UseCaseError("VALIDATION", "Only yearly billing_cycle is supported");
      }

      let couponBreakdown: CouponDiscountBreakdown | null = null;
      const normalizedCoupon = input.couponCode?.trim().toUpperCase() ?? "";

      if (normalizedCoupon) {
        if (!deps.coupons) {
          throw new UseCaseError("NOT_IMPLEMENTED", "Coupon validation is not configured");
        }
        couponBreakdown = await deps.coupons.validateForCheckoutByCode(ctx, {
          code: normalizedCoupon,
          planCode: input.planCode,
          billingCycle: input.billingCycle,
        });
      }

      const expectedAmount = couponBreakdown?.finalAmount ?? plan.amount;
      if (Math.abs(input.amount - expectedAmount) > 0.01) {
        throw new UseCaseError("VALIDATION", "Amount does not match the expected subscription price");
      }

      try {
        const existing = await deps.manualPaymentRepository.findPendingByCompanyId(ctx.companyId);
        if (existing) {
          throw new UseCaseError(
            "CONFLICT",
            "A pending bank transfer request already exists for this company"
          );
        }

        const subscription = await deps.billingRepository.getSubscription(ctx);
        const requestId = newManualPaymentRequestId();

        let proofFilePath: string;
        try {
          proofFilePath = await uploadPaymentProof(
            deps.serviceRoleClient,
            ctx.companyId,
            requestId,
            input.proofBuffer,
            input.proofContentType
          );
        } catch (err) {
          const code = err instanceof Error ? err.message : "upload_failed";
          if (code === "invalid_format") {
            throw new UseCaseError("VALIDATION", "Invalid file format. Use PDF, PNG, or JPG.");
          }
          if (code === "max_size") {
            throw new UseCaseError("VALIDATION", "File exceeds 5MB limit");
          }
          throw new UseCaseError("VALIDATION", "Failed to upload payment proof");
        }

        const created = await deps.manualPaymentRepository.createRequest(ctx, {
          id: requestId,
          subscriptionId: subscription?.id ?? null,
          amount: input.amount,
          currency: input.currency,
          planCode: input.planCode,
          billingCycle: input.billingCycle,
          proofFilePath,
          couponCode: couponBreakdown?.couponCode ?? null,
          couponId: couponBreakdown?.couponId ?? null,
          originalAmount: couponBreakdown?.originalAmount ?? null,
          discountAmount: couponBreakdown?.discountAmount ?? null,
        });

        return { requestId: created.id, status: created.status };
      } catch (error) {
        rethrowManualPaymentError(error, "Failed to submit manual payment");
      }
    },

    async listManualPaymentsForPlatform(
      _ctx: PlatformContext,
      input: { status?: ManualPaymentStatus; page: number; limit: number }
    ): Promise<{ items: ManualPaymentRequestModel[]; total: number; page: number; limit: number }> {
      try {
        const offset = (input.page - 1) * input.limit;
        const result = await deps.manualPaymentRepository.listForPlatform({
          status: input.status,
          limit: input.limit,
          offset,
        });
        return {
          items: result.items,
          total: result.total,
          page: input.page,
          limit: input.limit,
        };
      } catch (error) {
        rethrowManualPaymentError(error, "Failed to list manual payments");
      }
    },

    async getManualPaymentForPlatform(_ctx: PlatformContext, id: string) {
      try {
        const row = await deps.manualPaymentRepository.getByIdForPlatform(id);
        if (!row) throw new UseCaseError("NOT_FOUND", "Manual payment request not found");
        return row;
      } catch (error) {
        rethrowManualPaymentError(error, "Failed to load manual payment request");
      }
    },

    async approveManualPayment(
      ctx: PlatformContext,
      id: string,
      adminNote?: string | null
    ): Promise<ApproveManualPaymentResult> {
      try {
        const request = await deps.manualPaymentRepository.getByIdForPlatform(id);
        if (!request) throw new UseCaseError("NOT_FOUND", "Manual payment request not found");
        if (request.status !== "pending") {
          throw new UseCaseError("CONFLICT", "Manual payment request is not pending");
        }

        const subscription = await deps.billingRepository.getSubscriptionByCompanyId(request.companyId);
        if (!subscription) {
          throw new UseCaseError("NOT_FOUND", "Company subscription not found");
        }

        const period = computeYearlyBillingPeriod(subscription);
        const paidAt = new Date().toISOString();
        const initiatedBy =
          request.requestedBy ??
          (await deps.billingRepository.resolveCompanyOwnerUserId(request.companyId));

        const paymentId = await deps.billingRepository.createCompletedManualPayment({
          companyId: request.companyId,
          subscriptionId: subscription.id,
          amount: request.amount,
          currency: request.currency,
          planCode: request.planCode,
          billingCycle: request.billingCycle,
          paidAt,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          initiatedBy: initiatedBy ?? ctx.userId,
          manualPaymentRequestId: request.id,
          proofFilePath: request.proofFilePath,
          couponCode: request.couponCode,
          couponId: request.couponId,
          originalAmount: request.originalAmount,
          discountAmount: request.discountAmount,
        });

        if (
          request.couponId &&
          request.couponCode &&
          request.originalAmount != null &&
          request.discountAmount != null &&
          deps.coupons
        ) {
          const breakdown: CouponDiscountBreakdown = {
            valid: true,
            couponId: request.couponId,
            couponCode: request.couponCode,
            discountType: "fixed_amount",
            discountValue: request.discountAmount,
            originalAmount: request.originalAmount,
            discountAmount: request.discountAmount,
            finalAmount: request.amount,
            currency: request.currency,
            message: "Coupon applied",
          };
          await deps.coupons.recordRedemptionForPayment({
            companyId: request.companyId,
            redeemedBy: initiatedBy ?? ctx.userId,
            breakdown,
            paymentId,
            subscriptionId: subscription.id,
          });
        }

        await deps.billingRepository.activateOrExtendSubscription({
          subscriptionId: subscription.id,
          companyId: request.companyId,
          amount: request.amount,
          planCode: request.planCode,
          billingCycle: request.billingCycle,
          startsAt: period.startsAt,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
        });

        await deps.manualPaymentRepository.markApprovedViaRpc(request.id, paymentId, adminNote);

        if (deps.activityLog && initiatedBy) {
          try {
            await deps.activityLog.log(
              {
                userId: initiatedBy,
                companyId: request.companyId,
                role: "owner",
              },
              "billing.manual_payment_approved",
              paymentId,
              {
                entityType: "payment",
                manualPaymentRequestId: request.id,
                subscriptionId: subscription.id,
                periodEnd: period.periodEnd,
              }
            );
          } catch {
            // non-blocking
          }
        }

        void notifyAccountActivated({
          companyId: request.companyId,
          expiresAt: period.periodEnd,
        });

        return {
          requestId: request.id,
          paymentId,
          companyId: request.companyId,
          subscriptionId: subscription.id,
        };
      } catch (error) {
        rethrowManualPaymentError(error, "Failed to approve manual payment");
      }
    },

    async rejectManualPayment(
      ctx: PlatformContext,
      id: string,
      adminNote: string
    ): Promise<RejectManualPaymentResult> {
      if (!adminNote?.trim() || adminNote.trim().length < 3) {
        throw new UseCaseError("VALIDATION", "Rejection note is required");
      }

      try {
        const request = await deps.manualPaymentRepository.getByIdForPlatform(id);
        if (!request) throw new UseCaseError("NOT_FOUND", "Manual payment request not found");
        if (request.status !== "pending") {
          throw new UseCaseError("CONFLICT", "Manual payment request is not pending");
        }

        await deps.manualPaymentRepository.markRejectedViaRpc(id, adminNote.trim());

        const ownerId = await deps.billingRepository.resolveCompanyOwnerUserId(request.companyId);
        if (deps.activityLog && ownerId) {
          try {
            await deps.activityLog.log(
              {
                userId: ownerId,
                companyId: request.companyId,
                role: "owner",
              },
              "billing.manual_payment_rejected",
              request.id,
              {
                entityType: "manual_payment_request",
                adminNote: adminNote.trim(),
              }
            );
          } catch {
            // non-blocking
          }
        }

        return { requestId: request.id, companyId: request.companyId };
      } catch (error) {
        rethrowManualPaymentError(error, "Failed to reject manual payment");
      }
    },
  };
}
