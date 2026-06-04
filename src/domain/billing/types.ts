export type SubscriptionStatus =
  | "active"
  | "expired"
  | "suspended"
  | "trialing"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

export type PaymentGateway = "moyasar" | "hyperpay" | "stc_pay" | "manual";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface SubscriptionPlan {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  amount: number;
  currency: string;
  intervalMonths: number;
  trialDays: number;
  maxDocumentsPerMonth: number | null;
  active: boolean;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId?: string;
  planCode?: string;
  billingCycle?: BillingCycle;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  startsAt: string;
  expiresAt: string;
  nextRenewalAt?: string;
  autoRenew: boolean;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayReference: string | null;
  providerEventId?: string | null;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface BillingRepository {
  getActiveSubscription(
    ctx: import("../shared/types").TenantContext
  ): Promise<Subscription | null>;

  listPlans(): Promise<SubscriptionPlan[]>;

  listPayments(
    ctx: import("../shared/types").TenantContext
  ): Promise<PaymentTransaction[]>;
}
