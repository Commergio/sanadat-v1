import { NextResponse } from "next/server";
import { buildBillingWebhookApp } from "@/application/billing";
import { getManualWebhookSecret, isManualWebhookConfigured } from "@/lib/env";
import { mapBillingRouteError } from "../../_shared";

/**
 * Simulates a gateway webhook for manual checkout testing.
 * Protected by BILLING_MANUAL_WEBHOOK_SECRET header (not exposed to browsers in production).
 */
export async function POST(request: Request) {
  try {
    if (!isManualWebhookConfigured()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_IMPLEMENTED",
            message: "BILLING_MANUAL_WEBHOOK_SECRET is not configured",
          },
        },
        { status: 501 }
      );
    }

    const secret = request.headers.get("x-billing-webhook-secret");
    if (secret !== getManualWebhookSecret()) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Invalid webhook secret" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const payload =
      body?.gateway === undefined
        ? { ...body, gateway: "manual" as const }
        : body;

    if (payload.gateway && payload.gateway !== "manual") {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: "This endpoint only accepts gateway: manual",
          },
        },
        { status: 400 }
      );
    }

    const app = buildBillingWebhookApp();
    const result = await app.processPaymentWebhook({ ...payload, gateway: "manual" });
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
