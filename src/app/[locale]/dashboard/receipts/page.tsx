import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { emptyReceiptsList } from "@/lib/placeholders/dashboard";

export default async function ReceiptsPage() {
  const t = await getTranslations("dashboard");

  return (
    <>
      <DashboardHeader title={t("receipts")} />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={emptyReceiptsList}
          basePath="/dashboard/receipts"
          createHref="/dashboard/receipts/new"
          createLabel={`+ ${t("newReceipt")}`}
        />
      </main>
    </>
  );
}
