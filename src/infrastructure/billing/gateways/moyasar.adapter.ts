import { getAppUrl, getMoyasarSecretKey } from "@/lib/env";
import { routing } from "@/i18n/routing";
import { MoyasarGatewayError } from "./moyasar.errors";
import type {
  CheckoutGatewayPort,
  CreateCheckoutSessionInput,
  CheckoutSessionResult,
} from "./types";

const MOYASAR_API_BASE = "https://api.moyasar.com/v1";

/** Moyasar amounts are in the smallest currency unit (halalas for SAR). */
function toMoyasarAmount(amount: number, currency: string): number {
  if (currency === "SAR") return Math.round(amount * 100);
  return Math.round(amount * 100);
}

interface MoyasarInvoiceResponse {
  id: string;
  url: string;
  status: string;
}

/**
 * Moyasar sandbox checkout via hosted invoice page.
 * Supports Mada, Visa, and Mastercard on the hosted checkout (default networks).
 */
export class MoyasarCheckoutGateway implements CheckoutGatewayPort {
  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CheckoutSessionResult> {
    const secretKey = getMoyasarSecretKey();
    if (!secretKey) {
      throw new MoyasarGatewayError("Moyasar secret key is not configured");
    }

    const appUrl = getAppUrl();
    const locale = routing.defaultLocale;
    const subscriptionPath = `/${locale}/dashboard/subscription`;

    const body = {
      amount: toMoyasarAmount(input.amount, input.currency),
      currency: input.currency,
      description: `Sanadat subscription — ${input.planCode}`,
      metadata: {
        payment_id: input.paymentId,
        company_id: input.companyId,
        plan_code: input.planCode,
      },
      success_url: `${appUrl}${subscriptionPath}?checkout=success&payment_id=${input.paymentId}`,
      back_url: `${appUrl}${subscriptionPath}?checkout=cancelled&payment_id=${input.paymentId}`,
    };

    const auth = Buffer.from(`${secretKey}:`).toString("base64");
    const response = await fetch(`${MOYASAR_API_BASE}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as
      | MoyasarInvoiceResponse
      | { message?: string; errors?: unknown };

    if (!response.ok) {
      const message =
        payload && "message" in payload && payload.message
          ? String(payload.message)
          : "Moyasar invoice creation failed";
      throw new MoyasarGatewayError(message, response.status, payload);
    }

    const invoice = payload as MoyasarInvoiceResponse;
    if (!invoice.id || !invoice.url) {
      throw new MoyasarGatewayError("Moyasar response missing invoice id or url", response.status, payload);
    }

    return {
      checkoutUrl: invoice.url,
      checkoutSessionId: invoice.id,
      gatewayReference: invoice.id,
    };
  }
}
