import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildReceiptVoucherApp } from "@/application/documents/receipt-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";

function mapStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  return 500;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason } = (await request.json()) as { reason?: string };
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildReceiptVoucherApp(supabase);
    await app.cancelReceiptVoucher(ctx, id, reason ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to cancel receipt voucher" } },
      { status: 500 }
    );
  }
}
