import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import type { DocumentActivityAction } from "@/application/documents";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";
import { canExportReceipt } from "@/lib/documents/receipt-lifecycle";
import { canExportPayment } from "@/lib/documents/payment-lifecycle";
import type { DocumentLifecycleStatus } from "@/lib/types";

type Body = {
  action?: DocumentActivityAction;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

const EXPORT_ACTIONS = new Set<DocumentActivityAction>(["document.exported", "document.shared"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body.action || !body.entityId) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "action and entityId are required" } },
        { status: 400 }
      );
    }

    const ctx = await requireTenantContext();
    const supabase = await createClient();

    if (EXPORT_ACTIONS.has(body.action)) {
      const documentType = body.metadata?.documentType as string | undefined;
      if (documentType === "receipt_voucher") {
        const { data: receipt, error } = await supabase
          .from("receipt_vouchers")
          .select("lifecycle_status, display_number")
          .eq("id", body.entityId)
          .eq("company_id", ctx.companyId)
          .maybeSingle();

        if (error || !receipt) {
          return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Receipt voucher not found" } },
            { status: 404 }
          );
        }

        const lifecycle = receipt.lifecycle_status as DocumentLifecycleStatus | null;
        const displayNumber = receipt.display_number as string | null;

        if (!canExportReceipt(lifecycle, displayNumber)) {
          return NextResponse.json(
            {
              error: {
                code: "FORBIDDEN",
                message: "Cannot export or share receipt before customer approval",
              },
            },
            { status: 403 }
          );
        }
      }

      if (documentType === "payment_voucher") {
        const { data: payment, error } = await supabase
          .from("payment_vouchers")
          .select("lifecycle_status, display_number")
          .eq("id", body.entityId)
          .eq("company_id", ctx.companyId)
          .maybeSingle();

        if (error || !payment) {
          return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Payment voucher not found" } },
            { status: 404 }
          );
        }

        const lifecycle = payment.lifecycle_status as DocumentLifecycleStatus | null;
        const displayNumber = payment.display_number as string | null;

        if (!canExportPayment(lifecycle, displayNumber)) {
          return NextResponse.json(
            {
              error: {
                code: "FORBIDDEN",
                message: "Cannot export or share payment before customer approval",
              },
            },
            { status: 403 }
          );
        }
      }
    }

    const repo = new ActivityLogRepository(supabase);
    await repo.log(ctx, body.action, body.entityId, body.metadata ?? {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
