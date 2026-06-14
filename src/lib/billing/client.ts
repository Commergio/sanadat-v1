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
  reusedPending?: boolean;
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
