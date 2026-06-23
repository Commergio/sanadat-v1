import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildReceiptVoucherApp } from "@/application/documents/receipt-voucher.factory";
import { UseCaseError } from "@/application/shared/use-case-error";
import { toReceiptListRow } from "@/application/documents/receipt-voucher.presenter";
import { mapDocumentStatus } from "../documents/_shared";

function mapStatus(code: string): number {
  return mapDocumentStatus(code);
}

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildReceiptVoucherApp(supabase);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 50);
    const result = await app.listReceiptVouchers(ctx, { cursor, limit });
    return NextResponse.json({
      items: result.items.map(toReceiptListRow),
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
      { error: { code: "INTERNAL", message: "Failed to list receipts" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const input = await request.json();
    const supabase = await createClient();
    const app = buildReceiptVoucherApp(supabase);
    const created = await app.createReceiptVoucher(ctx, input);
    return NextResponse.json({
      id: created.id,
      displayNumber: created.displayNumber,
      redirectPath: `/dashboard/receipts/${created.id}`,
    });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to create receipt voucher" } },
      { status: 500 }
    );
  }
}
