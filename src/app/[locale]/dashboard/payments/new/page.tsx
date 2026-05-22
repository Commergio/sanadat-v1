import { DashboardHeader } from "@/components/dashboard/header";
import { VoucherForm } from "@/components/documents/voucher-form";

export default function NewPaymentPage() {
  return (
    <>
      <DashboardHeader title="سند صرف جديد" />
      <main className="flex-1 p-4 lg:p-8">
        <VoucherForm type="payment" redirectPath="/ar/dashboard/payments" />
      </main>
    </>
  );
}
