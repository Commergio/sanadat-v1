export type SubscriptionStatus =
  | "active"
  | "expired"
  | "suspended"
  | "trialing";

export type PaymentGateway = "moyasar" | "hyperpay" | "stc_pay";

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
  planId: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
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
