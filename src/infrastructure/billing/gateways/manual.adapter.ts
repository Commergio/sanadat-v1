import { randomBytes } from "crypto";
import { getAppUrl } from "@/lib/env";
import type { CheckoutGatewayPort, CreateCheckoutSessionInput, CheckoutSessionResult } from "./types";

/**
 * Mock/manual gateway — no external API calls.
 * Webhook confirmation (P2.3+) remains the source of truth for activation.
 */
export class ManualCheckoutGateway implements CheckoutGatewayPort {
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
    const checkoutSessionId = `manual_sess_${input.paymentId.replace(/-/g, "").slice(0, 12)}`;
    const gatewayReference = `manual_ref_${randomBytes(8).toString("hex")}`;
    const checkoutUrl = `${getAppUrl()}/billing/mock-checkout?payment_id=${input.paymentId}&session_id=${checkoutSessionId}`;

    return {
      checkoutUrl,
      checkoutSessionId,
      gatewayReference,
    };
  }
}
