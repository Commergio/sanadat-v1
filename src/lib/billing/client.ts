import type { BillingCycle, PaymentGateway, PaymentStatus, SubscriptionSource, SubscriptionStatus } from "@/lib/types";

export interface BillingSubscriptionApi {
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
  couponCode?: string | null;
  originalAmount?: number | null;
  discountAmount?: number | null;
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
  reusedPending?: boolean;
  couponCode?: string;
  originalAmount?: number;
  discountAmount?: number;
}

export function mapPaymentFromApi(row: Record<string, unknown>): BillingPaymentApi {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: String(row.id),
    companyId: String(row.companyId ?? row.company_id ?? ""),
    subscriptionId: (row.subscriptionId ?? row.subscription_id ?? null) as string | null,
    gateway: row.gateway as PaymentGateway,
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    status: row.status as PaymentStatus,
    gatewayReference: (row.gatewayReference ?? row.gateway_reference ?? null) as string | null,
    checkoutSessionId: (row.checkoutSessionId ?? row.checkout_session_id ?? null) as string | null,
    paidAt: (row.paidAt ?? row.paid_at ?? null) as string | null,
    failedAt: (row.failedAt ?? row.failed_at ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    couponCode:
      (row.couponCode as string | undefined) ??
      (typeof metadata.coupon_code === "string" ? metadata.coupon_code : null),
    originalAmount:
      row.originalAmount != null
        ? Number(row.originalAmount)
        : metadata.original_amount != null
          ? Number(metadata.original_amount)
          : null,
    discountAmount:
      row.discountAmount != null
        ? Number(row.discountAmount)
        : metadata.discount_amount != null
          ? Number(metadata.discount_amount)
          : null,
  };
}

export function mapBillingError(
  payload: {
    error?: {
      code?: string;
      message?: string;
      details?: { errors?: Record<string, string[] | string>; type?: string };
    };
  } | null,
  fallback: string
): { code: string; message: string } {
  const code = payload?.error?.code ?? "INTERNAL";
  const baseMessage = payload?.error?.message ?? fallback;
  const errors = payload?.error?.details?.errors;

  if (!errors || typeof errors !== "object") {
    return { code, message: baseMessage };
  }

  const parts: string[] = [];
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      for (const item of value) parts.push(`${field}: ${String(item)}`);
    } else if (value != null) {
      parts.push(`${field}: ${String(value)}`);
    }
  }

  if (parts.length === 0) {
    return { code, message: baseMessage };
  }

  if (baseMessage.includes(parts[0]!)) {
    return { code, message: baseMessage };
  }

  return { code, message: `${baseMessage} (${parts.join("; ")})` };
}
