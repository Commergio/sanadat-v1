import { isServiceRoleConfigured, validateMoyasarSandboxEnv } from "@/lib/env";
import { MoyasarGatewayError } from "@/infrastructure/billing/gateways/moyasar.errors";
import type { TenantContext } from "@/lib/tenant";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { getCheckoutGateway } from "@/infrastructure/billing/gateways";
import { assertCanReadBilling, assertCanStartCheckout } from "./authorization";
import { resolvePlanPrice } from "./constants";
import type { ActivityLogPort } from "@/application/documents";
import type { BillingRepositoryPort } from "./repository-ports";
import { startCheckoutInputSchema } from "./schemas";
import type { PaymentModel, StartCheckoutResult, SubscriptionModel } from "./types";
import { buildPaymentWebhookHandler } from "./webhook-use-cases";

function rethrowBillingError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof MoyasarGatewayError) {
    throw new UseCaseError("GATEWAY_ERROR", error.message, {
      statusCode: error.statusCode,
      details: error.details,
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
        const paymentId = await deps.repository.createPendingPayment(ctx, {
          subscriptionId: subscription?.id ?? null,
          gateway: parsed.data.gateway,
          amount: plan.amount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          billingCycle: "yearly",
        });

        const gateway = getCheckoutGateway(parsed.data.gateway);
        const session = await gateway.createCheckoutSession({
          companyId: ctx.companyId,
          paymentId,
          amount: plan.amount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          gateway: parsed.data.gateway,
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
          amount: plan.amount,
          currency: plan.currency,
          planCode: parsed.data.plan_code,
          billingCycle: "yearly",
          gateway: parsed.data.gateway,
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
