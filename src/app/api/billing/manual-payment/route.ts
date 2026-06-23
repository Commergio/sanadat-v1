import { NextResponse } from "next/server";
import {
  buildManualPaymentReadApp,
  buildManualPaymentTenantApp,
} from "@/application/billing";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { isServiceRoleConfigured } from "@/lib/env";
import { mapBillingRouteError } from "../_shared";

function sanitizeManualPaymentRequest(row: {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  requestedBy: string;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: "yearly";
  status: string;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: row.id,
    companyId: row.companyId,
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
  };
}

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildManualPaymentReadApp(supabase);
    const pending = await app.getTenantPendingRequest(ctx);
    return NextResponse.json({
      request: pending ? sanitizeManualPaymentRequest(pending) : null,
    });
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_IMPLEMENTED",
            message: "Manual bank transfer is not configured",
          },
        },
        { status: 501 }
      );
    }

    const ctx = await requireTenantContext();
    const form = await request.formData();
    const proof = form.get("proof");
    const planCode = String(form.get("plan_code") ?? "").trim();
    const billingCycle = String(form.get("billing_cycle") ?? "").trim();
    const amountRaw = form.get("amount");
    const currency = String(form.get("currency") ?? "SAR").trim() || "SAR";

    if (!(proof instanceof File) || proof.size === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Payment proof file is required" } },
        { status: 400 }
      );
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Invalid amount" } },
        { status: 400 }
      );
    }

    if (billingCycle !== "yearly") {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Only yearly billing_cycle is supported" } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await proof.arrayBuffer());
    const contentType = proof.type || "application/octet-stream";

    const supabase = await createClient();
    const app = buildManualPaymentTenantApp(supabase);
    const result = await app.submitManualPayment(ctx, {
      planCode,
      billingCycle: "yearly",
      amount,
      currency,
      proofBuffer: buffer,
      proofContentType: contentType,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const mapped = mapBillingRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
