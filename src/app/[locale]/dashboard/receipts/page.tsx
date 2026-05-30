import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { mockReceiptsList } from "@/lib/mock-data";

export default async function ReceiptsPage() {
  const t = await getTranslations("dashboard");

  return (
    <>
      <DashboardHeader title={t("receipts")} />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={mockReceiptsList}
          basePath="/dashboard/receipts"
          createHref="/dashboard/receipts/new"
          createLabel={`+ ${t("newReceipt")}`}
        />
      </main>
    </>
  );
}
