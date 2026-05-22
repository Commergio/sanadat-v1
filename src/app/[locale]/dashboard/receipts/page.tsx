import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTable } from "@/components/dashboard/documents-table";

const mockReceipts = [
  { id: "1", display_number: "قبض-128", party_name: "شركة الأمل للمقاولات", amount: 15000, date: "2026-05-20", status: "active" as const, payment_method: "bank_transfer" as const },
  { id: "2", display_number: "قبض-127", party_name: "محمد العتيبي", amount: 5000, date: "2026-05-17", status: "cancelled" as const, payment_method: "cash" as const },
  { id: "3", display_number: "قبض-126", party_name: "مؤسسة البناء", amount: 22000, date: "2026-05-15", status: "active" as const, payment_method: "pos" as const },
];

export default function ReceiptsPage() {
  return (
    <>
      <DashboardHeader title="سندات القبض" />
      <main className="flex-1 p-4 lg:p-8">
        <DocumentsTable
          documents={mockReceipts}
          basePath="/ar/dashboard/receipts"
          createHref="/ar/dashboard/receipts/new"
          createLabel="+ سند قبض"
        />
      </main>
    </>
  );
}
