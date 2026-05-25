import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";

const mockReceipts = [
  { id: "1", display_number: "REC-128", party_name: "Al Amal Contracting", amount: 15000, date: "2026-05-20", status: "active" as const, payment_method: "bank_transfer" as const },
  { id: "2", display_number: "REC-127", party_name: "Mohammed Al-Otaibi", amount: 5000, date: "2026-05-17", status: "cancelled" as const, payment_method: "cash" as const },
  { id: "3", display_number: "REC-126", party_name: "Building Corp", amount: 22000, date: "2026-05-15", status: "active" as const, payment_method: "pos" as const },
];

export default async function ReceiptsPage() {
  const t = await getTranslations("dashboard");

  return (
    <>
      <DashboardHeader title={t("receipts")} />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={mockReceipts}
          basePath="/dashboard/receipts"
          createHref="/dashboard/receipts/new"
          createLabel={`+ ${t("newReceipt")}`}
        />
      </main>
    </>
  );
}
