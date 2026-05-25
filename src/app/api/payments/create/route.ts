import { NextResponse } from "next/server";
import { createPayment } from "@/lib/payments";
import type { PaymentGateway } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gateway = (body.gateway || "moyasar") as PaymentGateway;
    const amount = body.amount || 399;
    const locale = body.locale === "en" ? "en" : "ar";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await createPayment({
      gateway,
      amount,
      companyId: body.companyId || "demo",
      callbackUrl: `${appUrl}/${locale}/dashboard/subscription?payment=success`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      reference: result.reference,
    });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء عملية الدفع" }, { status: 500 });
  }
}
