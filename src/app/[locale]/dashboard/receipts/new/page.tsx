import { DashboardHeader } from "@/components/dashboard/header";
import { VoucherForm } from "@/components/documents/voucher-form";

export default function NewReceiptPage() {
  return (
    <>
      <DashboardHeader title="سند قبض جديد" />
      <main className="flex-1 p-4 lg:p-8">
        <VoucherForm type="receipt" redirectPath="/ar/dashboard/receipts" />
      </main>
    </>
  );
}
