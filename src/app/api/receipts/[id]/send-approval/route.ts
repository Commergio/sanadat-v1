import { NextResponse } from "next/server";
import { buildReceiptVoucherApp } from "@/application/documents/receipt-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { parseLocalizedPath } from "@/lib/middleware/paths";
import { createClient } from "@/lib/supabase/server";

function mapStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "EXPIRED") return 410;
  return 500;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireTenantContext();
    const body = (await request.json().catch(() => ({}))) as { locale?: string };
    const referer = request.headers.get("referer");
    let locale = body.locale ?? "ar";
    if (referer) {
      try {
        const { locale: fromPath } = parseLocalizedPath(new URL(referer).pathname);
        locale = fromPath;
      } catch {
        // keep default
      }
    }

    const supabase = await createClient();
    const app = buildReceiptVoucherApp(supabase);
    const result = await app.sendReceiptForApproval(ctx, id, locale);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to send receipt for approval" } },
      { status: 500 }
    );
  }
}
