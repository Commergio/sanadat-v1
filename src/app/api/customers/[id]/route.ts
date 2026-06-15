import { NextResponse } from "next/server";
import { buildCustomerApp } from "@/application/customers";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildCustomerApp(supabase);
    const customer = await app.getCustomer(ctx, id);
    return NextResponse.json(await enrichCustomerRow(customer));
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load customer" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireTenantContext();
    const body = await request.json();
    const supabase = await createClient();
    const app = buildCustomerApp(supabase);
    const updated = await app.updateCustomer(ctx, id, body);
    return NextResponse.json(await enrichCustomerRow(updated));
  } catch (error) {
    if (error instanceof UseCaseError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: mapStatus(error.code) }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to update customer" } },
      { status: 500 }
    );
  }
}
