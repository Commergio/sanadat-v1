import { NextResponse } from "next/server";
import { buildManualPaymentPlatformApp } from "@/application/billing";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { isServiceRoleConfigured } from "@/lib/env";
import { createPaymentProofSignedUrl } from "@/lib/storage/payment-proof";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
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
    const app = buildManualPaymentPlatformApp(supabase);
    const row = await app.getManualPaymentForPlatform(ctx, id);

    let proofUrl: string | null = null;
    if (isServiceRoleConfigured()) {
      const serviceClient = createServiceRoleClient();
      proofUrl = await createPaymentProofSignedUrl(serviceClient, row.proofFilePath);
    }

    return NextResponse.json({
      request: {
        id: row.id,
        companyId: row.companyId,
        companyName: row.companyName ?? null,
        subscriptionId: row.subscriptionId,
        requestedBy: row.requestedBy,
        amount: row.amount,
        currency: row.currency,
        planCode: row.planCode,
        billingCycle: row.billingCycle,
        status: row.status,
        adminNote: row.adminNote,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        proofUrl,
      },
    });
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
