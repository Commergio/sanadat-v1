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
export async function POST(request: Request) {
  try {
    if (!isMoyasarWebhookConfigured()) {
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
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const webhookSecret = getMoyasarWebhookSecret()!;
    const signatureHeader = request.headers.get("x-moyasar-signature");

    const verified = verifyMoyasarWebhookRequest({
      rawBody,
      payload,
      signatureHeader,
      webhookSecret,
    });

    if (!verified.ok) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: verified.message } },
        { status: 403 }
      );
    }

    const mapped = mapMoyasarWebhookToPaymentInput(
      payload as unknown as MoyasarWebhookPayload
    );

    if (mapped.action === "invalid") {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: mapped.message } },
        { status: 400 }
      );
    }

    if (mapped.action === "ignore") {
      return NextResponse.json({
        ok: true,
        ignored: true,
        type: mapped.type,
        reason: mapped.reason,
      });
    }

    const app = buildBillingWebhookApp();
    const result = await app.processPaymentWebhook(mapped.input);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    if (mapped.status >= 500) {
      console.error("[moyasar:webhook] processing failed:", mapped.body.error.code);
    }
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
