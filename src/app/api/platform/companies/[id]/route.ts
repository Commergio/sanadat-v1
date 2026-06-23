import { NextResponse } from "next/server";
import { buildPlatformApp } from "@/application/platform";
import { buildInvitationCodePlatformApp } from "@/application/invitation-codes";
import { getTenantDocumentUsage } from "@/application/billing/trial-document-usage";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../../_shared";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePlatformContext("staff");
    const { id } = await params;
    const supabase = await createClient();
    const app = buildPlatformApp(supabase);
    const data = await app.getCompany(ctx, id);
    const invitationApp = buildInvitationCodePlatformApp(supabase);
    const promoRedemptions = await invitationApp.listRedemptionsForCompany(id);

    let trialUsage = null;
    if (data.company.subscriptionStatus === "trialing") {
      const usage = await getTenantDocumentUsage(supabase, { companyId: id });
      trialUsage = {
        receiptsCount: usage.receiptsCount,
        paymentsCount: usage.paymentsCount,
        invoicesCount: usage.invoicesCount,
        totalDocuments: usage.totalDocuments,
        trialLimit: usage.trialLimit,
        remainingDocuments: usage.remainingDocuments,
      };
    }

    return NextResponse.json({ ...data, trialUsage, promoRedemptions });
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
