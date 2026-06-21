import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildInvoiceApp } from "@/application/documents/invoice.factory";
import { enrichInvoiceDetail } from "@/application/documents/enrich-invoice-detail";
import { UseCaseError } from "@/application/shared/use-case-error";
import { InvoiceDetailClient } from "@/components/documents/invoice-detail-client";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import { invoiceDisplayNumber } from "@/lib/documents/invoice-lifecycle";
import type { Invoice } from "@/lib/types";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("dashboard");
  let errorCode: string | null = null;
  let doc: Invoice | null = null;
  let canCancel = false;
  let canSendApproval = false;

  try {
    const ctx = await requireTenantContext();
    canCancel = hasMinimumTenantRole(ctx.role, "accountant");
    canSendApproval = hasMinimumTenantRole(ctx.role, "accountant");
    const supabase = await createClient();
    const app = buildInvoiceApp(supabase);
    const invoice = await app.getInvoice(ctx, id);
    doc = await enrichInvoiceDetail(invoice);
  } catch (error) {
    if (error instanceof UseCaseError) {
      errorCode = error.code;
    } else {
      errorCode = "INTERNAL";
    }
  }

  const pageTitle = doc
    ? invoiceDisplayNumber(doc.display_number, doc.lifecycle_status) !== "—"
      ? doc.display_number!
      : t("invoiceDraftTitle")
    : id;

  return (
    <>
      <DashboardHeader title={pageTitle ?? id} />
      <main className="flex-1 p-4 lg:p-8">
        {!doc || errorCode ? (
          <EmptyState
            title={
              errorCode === "NOT_FOUND"
                ? "Invoice not found"
                : errorCode === "FORBIDDEN"
                  ? "Access denied"
                  : t("emptyDocsTitle")
            }
            description={
              errorCode === "NOT_FOUND"
                ? "The invoice does not exist or is outside your tenant scope."
                : errorCode === "FORBIDDEN"
                  ? "You do not have permission to view this invoice."
                  : t("emptyDocsDesc")
            }
            variant="documents"
            actionLabel={t("invoices")}
            actionHref="/dashboard/invoices"
          />
        ) : (
          <InvoiceDetailClient
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
