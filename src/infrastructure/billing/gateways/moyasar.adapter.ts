import { getAppUrl, getMoyasarSecretKey } from "@/lib/env";
import { routing } from "@/i18n/routing";
import {
  extractMoyasarValidationDetails,
  formatMoyasarErrorMessage,
  MoyasarGatewayError,
} from "./moyasar.errors";
import type {
  CheckoutGatewayPort,
  CreateCheckoutSessionInput,
  CheckoutSessionResult,
} from "./types";

const MOYASAR_INVOICES_URL = "https://api.moyasar.com/v1/invoices";

/** Moyasar amounts are in the smallest currency unit (halalas for SAR). Min 100 halalas. */
function toMoyasarAmount(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  const minorUnits = code === "SAR" || code === "KWD" ? 100 : 100;
  const halalas = Math.trunc(Math.round(amount * minorUnits));

  if (!Number.isInteger(halalas) || halalas < 100) {
    throw new MoyasarGatewayError(
      `Moyasar amount must be an integer >= 100 in smallest currency unit (got ${halalas})`
    );
  }

  return halalas;
}

function resolveMoyasarRedirectOrigin(appUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(appUrl);
  } catch {
    throw new MoyasarGatewayError(
      "NEXT_PUBLIC_APP_URL must be a valid absolute URL for Moyasar redirect URLs"
    );
  }

  const isLocal =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

  if (!isLocal && parsed.protocol !== "https:") {
    throw new MoyasarGatewayError(
      "Moyasar redirect URLs require HTTPS in NEXT_PUBLIC_APP_URL (except localhost)"
    );
  }

  return parsed.origin;
}

function buildSubscriptionRedirectUrl(
  origin: string,
  locale: string,
  outcome: "success" | "cancelled"
): string {
  const url = new URL(`/${locale}/dashboard/subscription`, origin);
  url.searchParams.set("checkout", outcome);
  return url.toString();
}

interface MoyasarInvoiceResponse {
  id: string;
  url: string;
  status: string;
}

/**
 * Moyasar sandbox checkout via hosted invoice page.
 * POST /v1/invoices — amount, currency, description, success_url, back_url.
 */
export class MoyasarCheckoutGateway implements CheckoutGatewayPort {
  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CheckoutSessionResult> {
    const secretKey = getMoyasarSecretKey();
    if (!secretKey) {
      throw new MoyasarGatewayError("Moyasar secret key is not configured");
    }

    const origin = resolveMoyasarRedirectOrigin(getAppUrl());
    const locale = routing.defaultLocale;
    const currency = input.currency.toUpperCase();

    if (currency.length !== 3) {
      throw new MoyasarGatewayError("Moyasar currency must be a 3-letter ISO-4217 code");
    }

    const description = `Sanadat subscription - ${input.planCode}`.slice(0, 255);

    const body: Record<string, string | number> = {
      amount: toMoyasarAmount(input.amount, currency),
      currency,
      description,
      success_url: buildSubscriptionRedirectUrl(origin, locale, "success"),
      back_url: buildSubscriptionRedirectUrl(origin, locale, "cancelled"),
    };

    const requestBody = JSON.stringify(body);
    const auth = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch(MOYASAR_INVOICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: requestBody,
    });

    const responseText = await response.text();
    let payload: MoyasarInvoiceResponse | Record<string, unknown> | null = null;
    try {
      payload = responseText ? (JSON.parse(responseText) as typeof payload) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = formatMoyasarErrorMessage(payload, "Moyasar invoice creation failed");
      throw new MoyasarGatewayError(
        message,
        response.status,
        extractMoyasarValidationDetails(payload)
      );
    }

    const invoice = payload as unknown as MoyasarInvoiceResponse;
    if (!invoice?.id || !invoice?.url) {
      throw new MoyasarGatewayError(
        "Moyasar response missing invoice id or url",
        response.status,
        extractMoyasarValidationDetails(payload)
      );
    }

    return {
      checkoutUrl: invoice.url,
      checkoutSessionId: invoice.id,
      gatewayReference: invoice.id,
    };
  }
}
