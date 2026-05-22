import { DashboardHeader } from "@/components/dashboard/header";
import { InvoiceForm } from "@/components/documents/invoice-form";

export default function NewInvoicePage() {
  return (
    <>
      <DashboardHeader title="فاتورة جديدة" />
      <main className="flex-1 p-4 lg:p-8">
        <InvoiceForm />
      </main>
    </>
  );
}
