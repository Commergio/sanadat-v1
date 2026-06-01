import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { emptyPaymentsList } from "@/lib/placeholders/dashboard";

export default async function PaymentsPage() {
  const t = await getTranslations("dashboard");

  return (
    <>
      <DashboardHeader title={t("payments")} />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={emptyPaymentsList}
          basePath="/dashboard/payments"
          createHref="/dashboard/payments/new"
          createLabel={`+ ${t("newPayment")}`}
        />
      </main>
    </>
  );
}
