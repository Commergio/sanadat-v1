import { NextResponse } from "next/server";
import { buildManualPaymentPlatformApp } from "@/application/billing";
import type { ManualPaymentStatus } from "@/application/billing/manual-payment-types";
import { requirePlatformContext } from "@/lib/auth/require-platform";
import { createClient } from "@/lib/supabase/server";
import { mapPlatformRouteError } from "../_shared";

const VALID_STATUSES = new Set<ManualPaymentStatus>(["pending", "approved", "rejected"]);

export async function GET(request: Request) {
  try {
    const ctx = await requirePlatformContext("staff");
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));

    const status =
      statusParam && VALID_STATUSES.has(statusParam as ManualPaymentStatus)
        ? (statusParam as ManualPaymentStatus)
        : undefined;

    const supabase = await createClient();
    const app = buildManualPaymentPlatformApp(supabase);
    const result = await app.listManualPaymentsForPlatform(ctx, { status, page, limit });

    return NextResponse.json({
      items: result.items.map((row) => ({
        id: row.id,
        companyId: row.companyId,
        companyName: row.companyName ?? null,
        subscriptionId: row.subscriptionId,
        amount: row.amount,
        currency: row.currency,
        planCode: row.planCode,
        billingCycle: row.billingCycle,
        status: row.status,
        adminNote: row.adminNote,
        reviewedAt: row.reviewedAt,
        createdAt: row.createdAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    const mapped = mapPlatformRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
