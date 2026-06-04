import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import { buildInvoiceApp } from "@/application/documents/invoice.factory";
import { toInvoiceDetail } from "@/application/documents/invoice.presenter";
import { UseCaseError } from "@/application/shared/use-case-error";
import { DocumentDetailView } from "@/components/documents/engine";
import { CancelDocumentButton } from "@/components/documents/engine/cancel-document-button";
import { Badge } from "@/components/ui/badge";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("dashboard");
  const td = await getTranslations("dashboard.table");
  let errorCode: string | null = null;
  let doc: ReturnType<typeof toInvoiceDetail> | null = null;
  let canCancel = false;

  try {
    const ctx = await requireTenantContext();
    canCancel = hasMinimumTenantRole(ctx.role, "accountant");
    const supabase = await createClient();
    const app = buildInvoiceApp(supabase);
    const invoice = await app.getInvoice(ctx, id);
    doc = toInvoiceDetail(invoice);
  } catch (error) {
    if (error instanceof UseCaseError) {
      errorCode = error.code;
    } else {
      errorCode = "INTERNAL";
    }
  }

  return (
    <>
      <DashboardHeader title={doc?.display_number ?? id} />
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
          <DocumentDetailView
            document={doc}
            actionsExtra={
              canCancel && doc.status === "active" ? (
                <CancelDocumentButton endpoint={`/api/invoices/${doc.id}/cancel`} />
              ) : null
            }
            header={
              <Badge variant={doc.status === "active" ? "success" : "destructive"}>
                {doc.status === "active" ? td("active") : td("cancelled")}
              </Badge>
            }
          />
        )}
      </main>
    </>
  );
}
