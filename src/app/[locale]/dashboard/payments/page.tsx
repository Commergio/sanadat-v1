import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";

const mockPayments = [
  { id: "1", display_number: "PAY-064", party_name: "Logistics Supplier", amount: 8200, date: "2026-05-18", status: "active" as const, payment_method: "cash" as const },
  { id: "2", display_number: "PAY-063", party_name: "Raw Materials Co", amount: 15000, date: "2026-05-14", status: "active" as const, payment_method: "bank_transfer" as const },
];

export default async function PaymentsPage() {
  const t = await getTranslations("dashboard");

  return (
    <>
      <DashboardHeader title={t("payments")} />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={mockPayments}
          basePath="/dashboard/payments"
          createHref="/dashboard/payments/new"
          createLabel={`+ ${t("newPayment")}`}
        />
      </main>
    </>
  );
}
