import type { BillingCycle, PaymentGateway, PaymentStatus, SubscriptionStatus } from "@/lib/types";

export type BillingGateway = "moyasar" | "hyperpay" | "stcpay" | "manual";

export type SubscriptionSource = "trial" | "paid" | "promo" | "admin_grant";

export interface SubscriptionModel {
  id: string;
  companyId: string;
  status: SubscriptionStatus;
  subscriptionSource: SubscriptionSource;
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

export interface PaymentModel {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayReference: string | null;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  updatedAt: string;
  couponCode?: string | null;
  originalAmount?: number | null;
  discountAmount?: number | null;
}

export interface StartCheckoutResult {
  paymentId: string;
  checkoutUrl: string;
  checkoutSessionId: string;
  gatewayReference: string;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: "yearly";
  gateway: BillingGateway;
  reusedPending?: boolean;
  couponCode?: string;
  originalAmount?: number;
  discountAmount?: number;
}
