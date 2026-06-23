import { NextResponse } from "next/server";
import { getTenantDocumentUsage } from "@/application/billing/trial-document-usage";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { mapBillingRouteError } from "../_shared";

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const usage = await getTenantDocumentUsage(supabase, { companyId: ctx.companyId });

    return NextResponse.json({
      subscriptionStatus: usage.subscriptionStatus,
      subscriptionExpiresAt: usage.subscriptionExpiresAt,
      subscriptionPeriodActive: usage.subscriptionPeriodActive,
      blockReason: usage.blockReason,
      receiptsCount: usage.receiptsCount,
      paymentsCount: usage.paymentsCount,
      invoicesCount: usage.invoicesCount,
      totalDocuments: usage.totalDocuments,
      trialLimit: usage.trialLimit,
      remainingDocuments:
        usage.subscriptionStatus === "active" ? null : usage.remainingDocuments,
      canCreateDocument: usage.canCreateDocument,
    });
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
