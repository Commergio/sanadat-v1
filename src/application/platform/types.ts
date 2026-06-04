import type { PaymentGateway, PaymentStatus, SubscriptionStatus } from "@/lib/types";

export type CompanyAccountStatus = "active" | "suspended";

export interface PlatformDashboardStatsModel {
  totalCompanies: number;
  activeCompanies: number;
  trialingCompanies: number;
  expiredCompanies: number;
  suspendedCompanies: number;
  accountSuspendedCompanies: number;
  totalRevenue: number;
  pendingPayments: number;
  generatedAt: string;
}

export interface CompanySubscriptionCurrentModel {
  companyId: string;
  companyName: string;
  ownerId: string | null;
  ownerEmail: string | null;
  accountStatus: CompanyAccountStatus;
  suspendedAt: string | null;
  suspendedBy: string | null;
  suspensionReason: string | null;
  companyCreatedAt: string;
  subscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  planCode: string | null;
  billingCycle: string | null;
  planAmount: number | null;
  planCurrency: string | null;
  subscriptionStartsAt: string | null;
  subscriptionExpiresAt: string | null;
  nextRenewalAt: string | null;
  autoRenew: boolean | null;
  cancelAtPeriodEnd: boolean | null;
  subscriptionCancelledAt: string | null;
  usersCount: number;
  documentsCount: number;
  latestActivityAt: string | null;
}

export interface PlatformPaymentModel {
  id: string;
  companyId: string;
  companyName: string | null;
  subscriptionId: string | null;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayReference: string | null;
  checkoutSessionId: string | null;
  providerEventId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export interface PlatformAdminActionModel {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformListResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SetCompanyStatusResult {
  ok: boolean;
  companyId: string;
  accountStatus: CompanyAccountStatus;
}

export interface ExtendSubscriptionResult {
  ok: boolean;
  subscriptionId: string;
  companyId: string;
  status: SubscriptionStatus;
  expiresAt: string;
}
