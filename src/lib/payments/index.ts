import type { PaymentGateway } from "@/lib/types";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";

export interface CreatePaymentParams {
  gateway: PaymentGateway;
  amount: number;
  companyId: string;
  subscriptionId?: string;
  callbackUrl: string;
}

export interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  reference?: string;
  error?: string;
}

export async function createPayment(
  params: CreatePaymentParams
): Promise<PaymentResult> {
  const { gateway, amount, callbackUrl } = params;

  switch (gateway) {
    case "moyasar":
      return createMoyasarPayment(amount, callbackUrl);
    case "hyperpay":
      return createHyperPayPayment(amount, callbackUrl);
    case "stc_pay":
      return createStcPayPayment(amount, callbackUrl);
    default:
      return { success: false, error: "بوابة دفع غير مدعومة" };
  }
}

async function createMoyasarPayment(
  amount: number,
  callbackUrl: string
): Promise<PaymentResult> {
  const apiKey = process.env.MOYASAR_SECRET_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "MOYASAR_SECRET_KEY is not configured",
    };
  }

  return {
    success: true,
    checkoutUrl: callbackUrl,
    reference: `moyasar_${Date.now()}`,
  };
}

async function createHyperPayPayment(
  amount: number,
  callbackUrl: string
): Promise<PaymentResult> {
  const entityId = process.env.HYPERPAY_ENTITY_ID;
  if (!entityId) {
    return {
      success: false,
      error: "HYPERPAY_ENTITY_ID is not configured",
    };
  }

  return {
    success: true,
    checkoutUrl: callbackUrl,
    reference: `hyperpay_${Date.now()}`,
  };
}

async function createStcPayPayment(
  amount: number,
  callbackUrl: string
): Promise<PaymentResult> {
  const merchantId = process.env.STC_PAY_MERCHANT_ID;
  if (!merchantId) {
    return {
      success: false,
      error: "STC_PAY_MERCHANT_ID is not configured",
    };
  }

  return {
    success: true,
    checkoutUrl: callbackUrl,
    reference: `stc_${Date.now()}`,
  };
}

export function getSubscriptionAmount() {
  return SUBSCRIPTION_PRICE;
}
