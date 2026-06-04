import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildReceiptVoucherApp } from "@/application/documents/receipt-voucher.factory";
import { toReceiptListRow } from "@/application/documents/receipt-voucher.presenter";
import { UseCaseError } from "@/application/shared/use-case-error";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function ReceiptsPage() {
  const t = await getTranslations("dashboard");
  let errorCode: string | null = null;
  let rows: ReturnType<typeof toReceiptListRow>[] = [];

  try {
    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const app = buildReceiptVoucherApp(supabase);
    const result = await app.listReceiptVouchers(ctx, { limit: 50 });
    rows = result.items.map(toReceiptListRow);
  } catch (error) {
    if (error instanceof UseCaseError) {
      errorCode = error.code;
    } else {
      errorCode = "INTERNAL";
    }
  }

  return (
    <>
      <DashboardHeader title={t("receipts")} />
      <main className="flex-1 p-4 lg:p-8">
        {errorCode ? (
          <EmptyState
            title={
              errorCode === "FORBIDDEN"
                ? "Access denied"
                : "Unable to load receipts"
            }
            description={
              errorCode === "FORBIDDEN"
                ? "You do not have permission to view receipts."
                : errorCode === "VALIDATION"
                  ? "Invalid request while loading receipts."
                  : "Please try again in a moment."
            }
            variant="documents"
            actionLabel={`+ ${t("newReceipt")}`}
            actionHref="/dashboard/receipts/new"
          />
        ) : (
          <DocumentsTable
            documents={rows}
            basePath="/dashboard/receipts"
            createHref="/dashboard/receipts/new"
            createLabel={`+ ${t("newReceipt")}`}
          />
        )}
      </main>
    </>
  );
}
