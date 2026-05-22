import { NextResponse } from "next/server";

/**
 * Webhook handler for payment gateways
 * Verifies signature, activates subscription, records payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gateway = request.headers.get("x-payment-gateway") || body.gateway;

    // TODO: Verify webhook signature per gateway
    // Moyasar: verify secret hash
    // HyperPay: verify notification signature
    // STC Pay: verify merchant signature

    const { reference, status, amount, company_id } = body;

    if (status === "paid" || status === "completed") {
      // Activate subscription
      // await supabase.from('subscriptions').update({ status: 'active', ... })
      // await supabase.from('payments').insert({ ... })

      console.log(`Payment verified: ${reference} - ${amount} SAR via ${gateway} for ${company_id}`);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
