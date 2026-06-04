import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildPaymentVoucherApp } from "@/application/documents/payment-voucher.factory";
import { toPaymentListRow } from "@/application/documents/payment-voucher.presenter";
import { UseCaseError } from "@/application/shared/use-case-error";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function PaymentsPage() {
  const t = await getTranslations("dashboard");
  let errorCode: string | null = null;
  let rows: ReturnType<typeof toPaymentListRow>[] = [];

  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildPaymentVoucherApp(supabase);
    const result = await app.listPaymentVouchers(ctx, { limit: 50 });
    rows = result.items.map(toPaymentListRow);
  } catch (error) {
    if (error instanceof UseCaseError) {
      errorCode = error.code;
    } else {
      errorCode = "INTERNAL";
    }
  }

  return (
    <>
      <DashboardHeader title={t("payments")} />
      <main className="flex-1 p-4 lg:p-8">
        {errorCode ? (
          <EmptyState
            title={
              errorCode === "FORBIDDEN"
                ? "Access denied"
                : "Unable to load payment vouchers"
            }
            description={
              errorCode === "FORBIDDEN"
                ? "You do not have permission to view payment vouchers."
                : errorCode === "VALIDATION"
                  ? "Invalid request while loading payment vouchers."
                  : "Please try again in a moment."
            }
            variant="documents"
            actionLabel={`+ ${t("newPayment")}`}
            actionHref="/dashboard/payments/new"
          />
        ) : (
          <DocumentsTable
            documents={rows}
            basePath="/dashboard/payments"
            createHref="/dashboard/payments/new"
            createLabel={`+ ${t("newPayment")}`}
          />
        )}
      </main>
    </>
  );
}
