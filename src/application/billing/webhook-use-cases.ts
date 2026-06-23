import type { ActivityLogPort } from "@/application/documents";
import { notifyAccountActivated } from "@/application/notifications/account-activated";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { isServiceRoleConfigured } from "@/lib/env";
import type { PaymentGateway } from "@/lib/types";
import type { BillingGateway } from "./types";
import { computeYearlyBillingPeriod } from "./period";
import type { BillingRepositoryPort } from "./repository-ports";
import { paymentWebhookInputSchema } from "./webhook-schemas";
import type { ProcessPaymentWebhookResult } from "./webhook-types";

function mapGatewayToDb(gateway: BillingGateway): PaymentGateway {
  if (gateway === "stcpay") return "stc_pay";
  return gateway;
}

function amountsMatch(expected: number, actual: number): boolean {
  return Math.abs(expected - actual) < 0.01;
}

function rethrowBillingError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

export function buildPaymentWebhookHandler(deps: {
  repository: BillingRepositoryPort;
  activityLog: ActivityLogPort;
}) {
  return {
    async processPaymentWebhook(input: unknown): Promise<ProcessPaymentWebhookResult> {
      if (!isServiceRoleConfigured()) {
        throw new UseCaseError(
          "NOT_IMPLEMENTED",
          "Billing webhook requires SUPABASE_SERVICE_ROLE_KEY on the server"
        );
      }

      const parsed = paymentWebhookInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid webhook payload", parsed.error.flatten());
      }

      const dbGateway = mapGatewayToDb(parsed.data.gateway);

      try {
        const existingByEvent = await deps.repository.findPaymentByProviderEventId(
          dbGateway,
          parsed.data.provider_event_id
        );

        if (existingByEvent) {
          const replayStatus =
            existingByEvent.status === "failed"
              ? "failed"
              : existingByEvent.status === "completed"
                ? "completed"
                : "completed";
          return {
            ok: true,
            duplicate: true,
            paymentId: existingByEvent.id,
            companyId: existingByEvent.companyId,
            subscriptionId: existingByEvent.subscriptionId,
            status: replayStatus,
          };
        }

        const payment = await deps.repository.findPaymentByGatewayReference(
          dbGateway,
          parsed.data.gateway_reference
        );

        if (!payment) {
          throw new UseCaseError("NOT_FOUND", "Invalid gateway_reference");
        }

        if (payment.status !== "pending") {
          return {
            ok: true,
            duplicate: true,
            paymentId: payment.id,
            companyId: payment.companyId,
            subscriptionId: payment.subscriptionId,
            status: payment.status === "failed" ? "failed" : "completed",
          };
        }

        if (!amountsMatch(payment.amount, parsed.data.amount)) {
          throw new UseCaseError(
            "VALIDATION",
            "Amount mismatch between webhook and pending payment"
          );
        }

        if (payment.currency.toUpperCase() !== parsed.data.currency.toUpperCase()) {
          throw new UseCaseError(
            "VALIDATION",
            "Currency mismatch between webhook and pending payment"
          );
        }

        const metadata = payment.metadata ?? {};
        const planCode = String(metadata.plan_code ?? "sanadat_annual");
        const billingCycle = "yearly" as const;

        const actorUserId =
          (metadata.initiated_by as string | undefined) ??
          (await deps.repository.resolveCompanyOwnerUserId(payment.companyId));

        if (!actorUserId) {
          throw new UseCaseError("VALIDATION", "Could not resolve user for activity log");
        }

        const logCtx = {
          userId: actorUserId,
          companyId: payment.companyId,
          role: "owner" as const,
        };

        if (parsed.data.status === "failed") {
          await deps.repository.failPaymentWebhook({
            paymentId: payment.id,
            companyId: payment.companyId,
            providerEventId: parsed.data.provider_event_id,
            failedAt: parsed.data.failed_at!,
            failureCode: parsed.data.failure_code,
            failureReason: parsed.data.failure_reason,
            rawPayload: parsed.data.raw_payload,
          });

          try {
            await deps.activityLog.log(logCtx, "billing.payment_failed", payment.id, {
              entityType: "payment",
              gateway: parsed.data.gateway,
              providerEventId: parsed.data.provider_event_id,
              gatewayReference: parsed.data.gateway_reference,
            });
          } catch {
            // non-blocking
          }

          return {
            ok: true,
            duplicate: false,
            paymentId: payment.id,
            companyId: payment.companyId,
            subscriptionId: payment.subscriptionId,
            status: "failed",
          };
        }

        const subscription = await deps.repository.getSubscriptionByCompanyId(payment.companyId);

        if (!subscription) {
          throw new UseCaseError("NOT_FOUND", "Company subscription not found");
        }

        const period = computeYearlyBillingPeriod(subscription);

        await deps.repository.completePaymentWebhook({
          paymentId: payment.id,
          companyId: payment.companyId,
          providerEventId: parsed.data.provider_event_id,
          paidAt: parsed.data.paid_at!,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          rawPayload: parsed.data.raw_payload,
        });

        await deps.repository.activateOrExtendSubscription({
          subscriptionId: subscription.id,
          companyId: payment.companyId,
          amount: payment.amount,
          planCode,
          billingCycle,
          startsAt: period.startsAt,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
        });

        try {
          await deps.activityLog.log(logCtx, "billing.payment_completed", payment.id, {
            entityType: "payment",
            gateway: parsed.data.gateway,
            providerEventId: parsed.data.provider_event_id,
            subscriptionId: subscription.id,
            periodEnd: period.periodEnd,
          });
        } catch {
          // non-blocking
        }

        void notifyAccountActivated({
          companyId: payment.companyId,
          expiresAt: period.periodEnd,
        });

        return {
          ok: true,
          duplicate: false,
          paymentId: payment.id,
          companyId: payment.companyId,
          subscriptionId: subscription.id,
          status: "completed",
        };
      } catch (error) {
        rethrowBillingError(error, "Failed to process payment webhook");
      }
    },
  };
}
