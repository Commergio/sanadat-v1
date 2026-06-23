import { NextResponse } from "next/server";
import { buildManualPaymentPlatformApp } from "@/application/billing";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../../_shared";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("admin");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNote = typeof body.admin_note === "string" ? body.admin_note : "";

    const supabase = await createClient();
    const app = buildManualPaymentPlatformApp(supabase);
    const data = await app.rejectManualPayment(ctx, id, adminNote);
    return NextResponse.json(data);
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
