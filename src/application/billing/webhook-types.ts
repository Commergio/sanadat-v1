import type { BillingGateway } from "./types";

export interface ProcessPaymentWebhookResult {
  ok: true;
  duplicate: boolean;
  paymentId: string;
  companyId: string;
  subscriptionId: string | null;
  status: "completed" | "failed";
}

export interface PaymentWebhookRecord {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  gateway: string;
  amount: number;
  currency: string;
  status: string;
  gatewayReference: string | null;
  providerEventId: string | null;
  metadata: Record<string, unknown>;
}

export interface ProcessPaymentWebhookPayload {
  gateway: BillingGateway;
  providerEventId: string;
  gatewayReference: string;
  status: "completed" | "failed";
  amount: number;
  currency: string;
  paidAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureReason?: string;
  rawPayload?: Record<string, unknown>;
}
