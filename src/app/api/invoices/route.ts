import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildInvoiceApp } from "@/application/documents/invoice.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { toInvoiceListRow } from "@/application/documents/invoice.presenter";

function mapStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  return 500;
}

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildInvoiceApp(supabase);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 50);
    const result = await app.listInvoices(ctx, { cursor, limit });
    return NextResponse.json({
      items: result.items.map(toInvoiceListRow),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to list invoices" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const input = await request.json();
    const supabase = await createClient();
    const app = buildInvoiceApp(supabase);
    const created = await app.createInvoice(ctx, input);
    return NextResponse.json({
      id: created.id,
      displayNumber: created.displayNumber,
      redirectPath: `/dashboard/invoices/${created.id}`,
    });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to create invoice" } },
      { status: 500 }
    );
  }
}
