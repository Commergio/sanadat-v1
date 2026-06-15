import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildReceiptVoucherApp } from "@/application/documents/receipt-voucher.factory";
import { toReceiptDetail } from "@/application/documents/receipt-voucher.presenter";
import { UseCaseError } from "@/application/shared/use-case-error";
import { ReceiptDetailClient } from "@/components/documents/receipt-detail-client";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import { receiptDisplayNumber } from "@/lib/documents/receipt-lifecycle";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("dashboard");
  let errorCode: string | null = null;
  let doc: ReturnType<typeof toReceiptDetail> | null = null;
  let canCancel = false;
  let canSendApproval = false;

  try {
    const ctx = await requireTenantContext();
    canCancel = hasMinimumTenantRole(ctx.role, "accountant");
    canSendApproval = hasMinimumTenantRole(ctx.role, "accountant");
    const supabase = await createClient();
    const app = buildReceiptVoucherApp(supabase);
    const receipt = await app.getReceiptVoucher(ctx, id);
    doc = toReceiptDetail(receipt);
  } catch (error) {
    if (error instanceof UseCaseError) {
      errorCode = error.code;
    } else {
      errorCode = "INTERNAL";
    }
  }

  const pageTitle = doc
    ? receiptDisplayNumber(doc.display_number, doc.lifecycle_status) !== "—"
      ? doc.display_number!
      : t("receiptDraftTitle")
    : id;

  return (
    <>
      <DashboardHeader title={pageTitle ?? id} />
      <main className="flex-1 p-4 lg:p-8">
        {!doc || errorCode ? (
          <EmptyState
            title={
              errorCode === "NOT_FOUND"
                ? "Receipt not found"
                : errorCode === "FORBIDDEN"
                  ? "Access denied"
                  : t("emptyDocsTitle")
            }
            description={
              errorCode === "NOT_FOUND"
                ? "The receipt does not exist or is outside your tenant scope."
                : errorCode === "FORBIDDEN"
                  ? "You do not have permission to view this receipt."
                  : t("emptyDocsDesc")
            }
            variant="documents"
            actionLabel={t("receipts")}
            actionHref="/dashboard/receipts"
          />
        ) : (
          <ReceiptDetailClient
            document={doc}
            canCancel={canCancel}
            canSendApproval={canSendApproval}
          />
        )}
      </main>
    </>
  );
}
