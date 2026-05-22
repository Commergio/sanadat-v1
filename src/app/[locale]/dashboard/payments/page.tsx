import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";

const mockPayments = [
  { id: "1", display_number: "صرف-064", party_name: "مورد الخدمات اللوجستية", amount: 8200, date: "2026-05-18", status: "active" as const, payment_method: "cash" as const },
  { id: "2", display_number: "صرف-063", party_name: "شركة المواد الخام", amount: 15000, date: "2026-05-14", status: "active" as const, payment_method: "bank_transfer" as const },
];

export default function PaymentsPage() {
  return (
    <>
      <DashboardHeader title="سندات الصرف" />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={mockPayments}
          basePath="/ar/dashboard/payments"
          createHref="/ar/dashboard/payments/new"
          createLabel="+ سند صرف"
        />
      </main>
    </>
  );
}
