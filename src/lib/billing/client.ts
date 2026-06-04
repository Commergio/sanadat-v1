import type { BillingCycle, PaymentGateway, PaymentStatus, SubscriptionStatus } from "@/lib/types";

export interface BillingSubscriptionApi {
  id: string;
  companyId: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: BillingCycle;
  startsAt: string;
  expiresAt: string;
  nextRenewalAt: string | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPaymentApi {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayReference: string | null;
  checkoutSessionId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export interface CheckoutResultApi {
  paymentId: string;
  checkoutUrl: string;
  checkoutSessionId: string;
  gatewayReference: string;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: "yearly";
  gateway: string;
}

export function mapBillingError(
  payload: { error?: { code?: string; message?: string } } | null,
  fallback: string
): { code: string; message: string } {
  return {
    code: payload?.error?.code ?? "INTERNAL",
    message: payload?.error?.message ?? fallback,
  };
}
