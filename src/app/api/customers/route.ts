import { NextResponse } from "next/server";
import { buildCustomerApp, parseCustomerListQuery } from "@/application/customers";
import { enrichCustomerRow } from "@/application/customers/enrich-customer";
import { UseCaseError } from "@/application/shared/use-case-error";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { createClient } from "@/lib/supabase/server";

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
    const query = parseCustomerListQuery(new URL(request.url).searchParams);
    const supabase = await createClient();
    const app = buildCustomerApp(supabase);
    const result = await app.listCustomers(ctx, query);
    const items = await Promise.all(result.items.map((c) => enrichCustomerRow(c)));
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to list customers" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = await request.json();
    const supabase = await createClient();
    const app = buildCustomerApp(supabase);
    const created = await app.createCustomer(ctx, body);
    return NextResponse.json(await enrichCustomerRow(created), { status: 201 });
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to create customer" } },
      { status: 500 }
    );
  }
}
