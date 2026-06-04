import type { TenantContext } from "@/lib/tenant";
import type { PaymentWebhookRecord } from "./webhook-types";
import type { BillingGateway, PaymentModel, SubscriptionModel } from "./types";
import type { PaymentGateway } from "@/lib/types";

export interface BillingRepositoryPort {
  getSubscription(ctx: TenantContext): Promise<SubscriptionModel | null>;
  listPayments(ctx: TenantContext): Promise<PaymentModel[]>;
  createPendingPayment(
    ctx: TenantContext,
    input: {
      subscriptionId: string | null;
      gateway: BillingGateway;
      amount: number;
      currency: string;
      planCode: string;
      billingCycle: "yearly";
    }
  ): Promise<string>;
  attachCheckoutSession(
    companyId: string,
    paymentId: string,
    session: {
      checkoutSessionId: string;
      gatewayReference: string;
      checkoutUrl: string;
      gateway: BillingGateway;
    }
  ): Promise<void>;
  findPaymentByProviderEventId(
    gateway: PaymentGateway,
    providerEventId: string
  ): Promise<PaymentWebhookRecord | null>;
  findPaymentByGatewayReference(
    gateway: PaymentGateway,
    gatewayReference: string
  ): Promise<PaymentWebhookRecord | null>;
  completePaymentWebhook(input: {
    paymentId: string;
    companyId: string;
    providerEventId: string;
    paidAt: string;
    periodStart: string;
    periodEnd: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<void>;
  failPaymentWebhook(input: {
    paymentId: string;
    companyId: string;
    providerEventId: string;
    failedAt: string;
    failureCode?: string;
    failureReason?: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<void>;
  activateOrExtendSubscription(input: {
    subscriptionId: string;
    companyId: string;
    amount: number;
    planCode: string;
    billingCycle: "yearly";
    startsAt: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<void>;
  getSubscriptionByCompanyId(companyId: string): Promise<SubscriptionModel | null>;
  resolveCompanyOwnerUserId(companyId: string): Promise<string | null>;
}
