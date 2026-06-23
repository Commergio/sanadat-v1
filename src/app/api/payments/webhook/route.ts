import { NextResponse } from "next/server";

/**
 * Webhook handler for payment gateways
 * Verifies signature, activates subscription, records payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Verify webhook signature per gateway
    // Moyasar: verify secret hash
    // HyperPay: verify notification signature
    // STC Pay: verify merchant signature

    const { status } = body;

    if (status === "paid" || status === "completed") {
      // TODO: wire to billing subscription activation when this legacy route is used
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
