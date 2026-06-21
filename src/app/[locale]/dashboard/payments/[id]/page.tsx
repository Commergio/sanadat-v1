import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildPaymentVoucherApp } from "@/application/documents/payment-voucher.factory";
import { enrichPaymentDetail } from "@/application/documents/enrich-payment-detail";
import { UseCaseError } from "@/application/shared/use-case-error";
import { PaymentDetailClient } from "@/components/documents/payment-detail-client";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import { paymentDisplayNumber } from "@/lib/documents/payment-lifecycle";
import type { PaymentVoucher } from "@/lib/types";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("dashboard");
  let errorCode: string | null = null;
  let doc: PaymentVoucher | null = null;
  let canCancel = false;
  let canSendApproval = false;

  try {
    const ctx = await requireTenantContext();
    canCancel = hasMinimumTenantRole(ctx.role, "accountant");
    canSendApproval = hasMinimumTenantRole(ctx.role, "accountant");
    const supabase = await createClient();
    const app = buildPaymentVoucherApp(supabase);
    const payment = await app.getPaymentVoucher(ctx, id);
    doc = await enrichPaymentDetail(payment);
  } catch (error) {
    if (error instanceof UseCaseError) {
      errorCode = error.code;
    } else {
      errorCode = "INTERNAL";
    }
  }

  const pageTitle = doc
    ? paymentDisplayNumber(doc.display_number, doc.lifecycle_status) !== "—"
      ? doc.display_number!
      : t("paymentDraftTitle")
    : id;

  return (
    <>
      <DashboardHeader title={pageTitle ?? id} />
      <main className="flex-1 p-4 lg:p-8">
        {!doc || errorCode ? (
          <EmptyState
            title={
              errorCode === "NOT_FOUND"
                ? "Payment voucher not found"
                : errorCode === "FORBIDDEN"
                  ? "Access denied"
                  : t("emptyDocsTitle")
            }
            description={
              errorCode === "NOT_FOUND"
                ? "The payment voucher does not exist or is outside your tenant scope."
                : errorCode === "FORBIDDEN"
                  ? "You do not have permission to view this payment voucher."
                  : t("emptyDocsDesc")
            }
            variant="documents"
            actionLabel={t("payments")}
            actionHref="/dashboard/payments"
          />
        ) : (
          <PaymentDetailClient
            document={doc}
            customerSignatureUrl={doc.customer_signature_url ?? null}
            canCancel={canCancel}
            canSendApproval={canSendApproval}
          />
        )}
      </main>
    </>
  );
}
