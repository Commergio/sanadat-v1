import type { BillingGateway } from "@/application/billing";

export interface CreateCheckoutSessionInput {
  companyId: string;
  paymentId: string;
  amount: number;
  currency: string;
  planCode: string;
  gateway: BillingGateway;
  couponCode?: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  checkoutSessionId: string;
  gatewayReference: string;
}

export interface CheckoutGatewayPort {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult>;
}
