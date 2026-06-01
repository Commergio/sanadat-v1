import { NextResponse } from "next/server";

/** Payment checkout — implemented in P2 (billing). */
export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Subscription payments are not available yet.",
      },
    },
    { status: 501 }
  );
}
