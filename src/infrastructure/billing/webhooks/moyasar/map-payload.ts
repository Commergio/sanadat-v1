import type { PaymentWebhookInput } from "@/application/billing/webhook-schemas";
import type { MoyasarWebhookPayload, MoyasarWebhookPaymentData } from "./types";

/** Moyasar amounts are in halalas for SAR (1 SAR = 100). */
export function fromMoyasarAmount(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (code === "SAR" || code === "KWD") return amount / 100;
  return amount / 100;
}

const COMPLETED_EVENT_TYPES = new Set(["payment_paid"]);

const FAILED_EVENT_TYPES = new Set([
  "payment_faild", // documented typo in Moyasar API
  "payment_failed",
  "payment_voided",
  "payment_canceled",
  "payment_cancelled",
  "payment_expired",
  "payment_abandoned",
]);

const IGNORED_EVENT_TYPES = new Set([
  "payment_authorized",
  "payment_captured",
  "payment_verified",
  "payment_refunded",
]);

function resolveGatewayReference(data: MoyasarWebhookPaymentData): string | null {
  if (data.invoice_id) return data.invoice_id;
  return null;
}

function resolveTimestamp(
  data: MoyasarWebhookPaymentData,
  envelope: MoyasarWebhookPayload
): string {
  return data.updated_at ?? data.created_at ?? envelope.created_at ?? new Date().toISOString();
}

export type MoyasarWebhookMapResult =
  | { action: "process"; input: PaymentWebhookInput }
  | { action: "ignore"; type: string; reason: string }
  | { action: "invalid"; message: string };

export function mapMoyasarWebhookToPaymentInput(
  envelope: MoyasarWebhookPayload
): MoyasarWebhookMapResult {
  const eventType = envelope.type?.trim() ?? "";
  const data = envelope.data;

  if (!envelope.id || !data?.id) {
    return { action: "invalid", message: "Missing Moyasar webhook id or payment data" };
  }

  if (IGNORED_EVENT_TYPES.has(eventType)) {
    return {
      action: "ignore",
      type: eventType,
      reason: "Event does not require billing journal update",
    };
  }

  const gatewayReference = resolveGatewayReference(data);
  if (!gatewayReference) {
    return {
      action: "invalid",
      message: "Moyasar payment missing invoice_id (required to match pending checkout)",
    };
  }

  const amount = fromMoyasarAmount(data.amount, data.currency);
  const at = resolveTimestamp(data, envelope);
  const rawPayload = envelope as unknown as Record<string, unknown>;

  if (COMPLETED_EVENT_TYPES.has(eventType)) {
    return {
      action: "process",
      input: {
        gateway: "moyasar",
        provider_event_id: envelope.id,
        gateway_reference: gatewayReference,
        status: "completed",
        amount,
        currency: data.currency,
        paid_at: at,
        raw_payload: rawPayload,
      },
    };
  }

  if (FAILED_EVENT_TYPES.has(eventType)) {
    return {
      action: "process",
      input: {
        gateway: "moyasar",
        provider_event_id: envelope.id,
        gateway_reference: gatewayReference,
        status: "failed",
        amount,
        currency: data.currency,
        failed_at: at,
        failure_code: data.status ?? eventType,
        failure_reason: data.source?.message ?? eventType,
        raw_payload: rawPayload,
      },
    };
  }

  return {
    action: "ignore",
    type: eventType,
    reason: "Unhandled Moyasar event type",
  };
}
