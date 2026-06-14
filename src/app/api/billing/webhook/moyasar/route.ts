import { NextResponse } from "next/server";
import { buildBillingWebhookApp } from "@/application/billing";
import {
  getMoyasarWebhookSecret,
  isMoyasarWebhookConfigured,
} from "@/lib/env";
import { mapMoyasarWebhookToPaymentInput } from "@/infrastructure/billing/webhooks/moyasar/map-payload";
import type { MoyasarWebhookPayload } from "@/infrastructure/billing/webhooks/moyasar/types";
import { verifyMoyasarWebhookRequest } from "@/infrastructure/billing/webhooks/moyasar/verify";
import { mapBillingRouteError } from "../../_shared";

/**
 * Moyasar payment webhooks — activates subscription via processPaymentWebhook.
 * Configure in Moyasar Dashboard → Webhooks → payment_paid, payment_failed, etc.
 */

/** Temporary debug logging — remove after webhook verification. */
function detectEventType(payload: Record<string, unknown>): string {
  if (typeof payload.type === "string" && payload.type.trim()) {
    return payload.type.trim();
  }
  if (typeof payload.event === "string" && payload.event.trim()) {
    return payload.event.trim();
  }
  if (typeof payload.name === "string" && payload.name.trim()) {
    return payload.name.trim();
  }
  return "(missing)";
}

function redactWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  if (typeof out.secret_token === "string") {
    out.secret_token = "[REDACTED]";
  }
  return out;
}

function logMoyasarWebhookRequest(details: {
  status: number;
  outcome: string;
  payload?: Record<string, unknown>;
  eventType?: string;
  hasSignature?: boolean;
}) {
  const eventType =
    details.eventType ??
    (details.payload ? detectEventType(details.payload) : "(unknown)");

  console.log("[moyasar:webhook:debug]", {
    outcome: details.outcome,
    status: details.status,
    eventType,
    hasSignature: details.hasSignature,
    payload: details.payload ? redactWebhookPayload(details.payload) : undefined,
  });
}

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("x-moyasar-signature");
  let payload: Record<string, unknown> = {};

  logMoyasarWebhookRequest({
    status: 0,
    outcome: "received",
    hasSignature: Boolean(signatureHeader),
  });

  try {
    if (!isMoyasarWebhookConfigured()) {
      logMoyasarWebhookRequest({
        status: 501,
        outcome: "not_configured",
        hasSignature: Boolean(signatureHeader),
      });
      return NextResponse.json(
        {
          error: {
            code: "NOT_IMPLEMENTED",
            message: "MOYASAR_WEBHOOK_SECRET is not configured",
          },
        },
        { status: 501 }
      );
    }

    const rawBody = await request.text();
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      logMoyasarWebhookRequest({
        status: 400,
        outcome: "invalid_json",
        hasSignature: Boolean(signatureHeader),
      });
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const eventType = detectEventType(payload);

    logMoyasarWebhookRequest({
      status: 0,
      outcome: "parsed",
      payload,
      eventType,
      hasSignature: Boolean(signatureHeader),
    });

    const webhookSecret = getMoyasarWebhookSecret()!;

    const verified = verifyMoyasarWebhookRequest({
      rawBody,
      payload,
      signatureHeader,
      webhookSecret,
    });

    if (!verified.ok) {
      logMoyasarWebhookRequest({
        status: 403,
        outcome: "verification_failed",
        payload,
        eventType,
        hasSignature: Boolean(signatureHeader),
      });
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: verified.message } },
        { status: 403 }
      );
    }

    const mapped = mapMoyasarWebhookToPaymentInput(
      payload as unknown as MoyasarWebhookPayload
    );

    if (mapped.action === "invalid") {
      logMoyasarWebhookRequest({
        status: 400,
        outcome: "invalid_payload",
        payload,
        eventType,
        hasSignature: Boolean(signatureHeader),
      });
      return NextResponse.json(
        { error: { code: "VALIDATION", message: mapped.message } },
        { status: 400 }
      );
    }

    if (mapped.action === "ignore") {
      logMoyasarWebhookRequest({
        status: 200,
        outcome: "ignored",
        payload,
        eventType: mapped.type,
        hasSignature: Boolean(signatureHeader),
      });
      return NextResponse.json({
        ok: true,
        ignored: true,
        type: mapped.type,
        reason: mapped.reason,
      });
    }

    const app = buildBillingWebhookApp();
    const result = await app.processPaymentWebhook(mapped.input);
    logMoyasarWebhookRequest({
      status: 200,
      outcome: "processed",
      payload,
      eventType,
      hasSignature: Boolean(signatureHeader),
    });
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    logMoyasarWebhookRequest({
      status: mapped.status,
      outcome: "error",
      payload,
      eventType: payload ? detectEventType(payload) : "(unknown)",
      hasSignature: Boolean(signatureHeader),
    });
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
