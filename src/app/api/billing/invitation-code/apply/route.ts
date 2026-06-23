import { NextResponse } from "next/server";
import { buildInvitationCodeTenantApp } from "@/application/invitation-codes";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { isServiceRoleConfigured } from "@/lib/env";
import { mapBillingRouteError } from "../../_shared";

export async function POST(request: Request) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_IMPLEMENTED",
            message: "Invitation code activation is not configured",
          },
        },
        { status: 501 }
      );
    }

    const ctx = await requireTenantContext();
    const body = await request.json();
    const supabase = await createClient();
    const app = buildInvitationCodeTenantApp(supabase);
    const result = await app.applyForTenant(ctx, body);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
