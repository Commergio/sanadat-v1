import { isServiceRoleConfigured, validateMoyasarSandboxEnv } from "@/lib/env";
import { MoyasarGatewayError } from "@/infrastructure/billing/gateways/moyasar.errors";
import type { TenantContext } from "@/lib/tenant";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { getCheckoutGateway } from "@/infrastructure/billing/gateways";
import { assertCanReadBilling, assertCanStartCheckout } from "./authorization";
import { resolvePlanPrice } from "./constants";
import type { ActivityLogPort } from "@/application/documents";
import type { CouponDiscountBreakdown } from "@/application/coupons/types";
import type { buildCouponUseCases } from "@/application/coupons/use-cases";
import type { BillingRepositoryPort } from "./repository-ports";
import { startCheckoutInputSchema } from "./schemas";
import type { PaymentModel, StartCheckoutResult, SubscriptionModel } from "./types";
import { buildPaymentWebhookHandler } from "./webhook-use-cases";

type CouponCheckoutService = ReturnType<typeof buildCouponUseCases>;

function rethrowBillingError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof MoyasarGatewayError) {
    const validation =
      error.details && typeof error.details === "object"
        ? (error.details as { type?: string; errors?: Record<string, string[] | string> })
        : undefined;
    throw new UseCaseError("GATEWAY_ERROR", error.message, {
      statusCode: error.statusCode,
      ...(validation?.errors ? { errors: validation.errors } : {}),
      ...(validation?.type ? { type: validation.type } : {}),
    });
  }
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

interface BillingUseCaseDeps {
  repository: BillingRepositoryPort;
  activityLog?: ActivityLogPort;
  coupons?: CouponCheckoutService;
}

export function buildBillingUseCases(deps: BillingUseCaseDeps) {
  const webhook = deps.activityLog
    ? buildPaymentWebhookHandler({
        repository: deps.repository,
        activityLog: deps.activityLog,
      })
    : null;

  return {
    async getSubscription(ctx: TenantContext): Promise<SubscriptionModel | null> {
      assertCanReadBilling(ctx);
      try {
        return await deps.repository.getSubscription(ctx);
      } catch (error) {
        rethrowBillingError(error, "Failed to load subscription");
      }
    },

    async listPayments(ctx: TenantContext): Promise<PaymentModel[]> {
      assertCanReadBilling(ctx);
      try {
        return await deps.repository.listPayments(ctx);
      } catch (error) {
        rethrowBillingError(error, "Failed to list payments");
      }
    },

    async startCheckout(
      ctx: TenantContext,
      input: unknown
    ): Promise<StartCheckoutResult> {
      assertCanStartCheckout(ctx);

      if (!isServiceRoleConfigured()) {
        throw new UseCaseError(
          "NOT_IMPLEMENTED",
          "Billing checkout requires SUPABASE_SERVICE_ROLE_KEY on the server"
        );
      }

      const parsed = startCheckoutInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid checkout input", parsed.error.flatten());
      }

      const plan = resolvePlanPrice(parsed.data.plan_code);
      if (!plan) {
        throw new UseCaseError("VALIDATION", "Unknown plan_code");
      }

      if (parsed.data.billing_cycle !== plan.billingCycle) {
        throw new UseCaseError("VALIDATION", "Only yearly billing_cycle is supported");
      }

      if (parsed.data.gateway === "moyasar") {
        const moyasarEnv = validateMoyasarSandboxEnv();
        if (!moyasarEnv.ok) {
          throw new UseCaseError("NOT_IMPLEMENTED", moyasarEnv.message ?? "Moyasar is not configured");
        }
      }

      try {
        const subscription = await deps.repository.getSubscription(ctx);

        let checkoutAmount = plan.amount;
        let couponBreakdown: CouponDiscountBreakdown | null = null;

        if (parsed.data.coupon_code) {
          if (!deps.coupons) {
            throw new UseCaseError(
              "NOT_IMPLEMENTED",
              "Coupon checkout requires SUPABASE_SERVICE_ROLE_KEY on the server"
            );
          }

          couponBreakdown = await deps.coupons.validateForCheckoutByCode(ctx, {
            code: parsed.data.coupon_code,
            planCode: parsed.data.plan_code,
            billingCycle: "yearly",
          });
          checkoutAmount = couponBreakdown.finalAmount;

          if (checkoutAmount < 1 && parsed.data.gateway === "moyasar") {
            throw new UseCaseError(
              "VALIDATION",
              "Amount after discount is below the minimum for card checkout"
            );
          }
        }

        const pendingLookup = await deps.repository.findPendingCheckoutPayment(ctx, {
          gateway: parsed.data.gateway,
          amount: checkoutAmount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          couponCode: couponBreakdown?.couponCode ?? null,
        });

        if (pendingLookup?.kind === "reuse") {
          return pendingLookup.result;
        }

        if (pendingLookup?.kind === "blocked") {
          throw new UseCaseError(
            "CONFLICT",
            "لديك دفعة قيد الانتظار، أكملها أو انتظر انتهاء صلاحيتها قبل إنشاء دفعة جديدة."
          );
        }

        const paymentId = await deps.repository.createPendingPayment(ctx, {
          subscriptionId: subscription?.id ?? null,
          gateway: parsed.data.gateway,
          amount: checkoutAmount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          billingCycle: "yearly",
          originalAmount: couponBreakdown?.originalAmount ?? plan.amount,
          discountAmount: couponBreakdown?.discountAmount ?? 0,
          couponCode: couponBreakdown?.couponCode,
          couponId: couponBreakdown?.couponId,
        });

        if (couponBreakdown && deps.coupons) {
          await deps.coupons.recordCheckoutRedemption(
            ctx,
            couponBreakdown,
            paymentId,
            subscription?.id ?? null
          );

          if (deps.activityLog) {
            await deps.activityLog.log(ctx, "coupon.applied", paymentId, {
              coupon_code: couponBreakdown.couponCode,
              coupon_id: couponBreakdown.couponId,
              original_amount: couponBreakdown.originalAmount,
              discount_amount: couponBreakdown.discountAmount,
              final_amount: couponBreakdown.finalAmount,
              plan_code: parsed.data.plan_code,
              gateway: parsed.data.gateway,
            });
          }
        }

        const gateway = getCheckoutGateway(parsed.data.gateway);
        const session = await gateway.createCheckoutSession({
          companyId: ctx.companyId,
          paymentId,
          amount: checkoutAmount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          gateway: parsed.data.gateway,
          couponCode: couponBreakdown?.couponCode,
        });

        await deps.repository.attachCheckoutSession(ctx.companyId, paymentId, {
          checkoutSessionId: session.checkoutSessionId,
          gatewayReference: session.gatewayReference,
          checkoutUrl: session.checkoutUrl,
          gateway: parsed.data.gateway,
        });

        return {
          paymentId,
          checkoutUrl: session.checkoutUrl,
          checkoutSessionId: session.checkoutSessionId,
          gatewayReference: session.gatewayReference,
          amount: checkoutAmount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          billingCycle: "yearly",
          gateway: parsed.data.gateway,
          couponCode: couponBreakdown?.couponCode,
          originalAmount: couponBreakdown?.originalAmount ?? plan.amount,
          discountAmount: couponBreakdown?.discountAmount ?? 0,
        };
      } catch (error) {
        rethrowBillingError(error, "Failed to start checkout");
      }
    },

    async processPaymentWebhook(input: unknown) {
      if (!webhook) {
        throw new UseCaseError(
          "NOT_IMPLEMENTED",
          "Webhook processing is not configured (missing activity log)"
        );
      }
      return webhook.processPaymentWebhook(input);
    },
  };
}
