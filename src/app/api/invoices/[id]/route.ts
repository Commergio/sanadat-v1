import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildInvoiceApp } from "@/application/documents/invoice.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { toInvoiceDetail } from "@/application/documents/invoice.presenter";

function mapStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  return 500;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildInvoiceApp(supabase);
    const invoice = await app.getInvoice(ctx, id);
    return NextResponse.json({ item: toInvoiceDetail(invoice) });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load invoice" } },
      { status: 500 }
    );
  }
}
