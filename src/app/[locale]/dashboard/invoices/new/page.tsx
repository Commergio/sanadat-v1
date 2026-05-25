import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { InvoiceForm } from "@/components/documents/invoice-form";

export default async function NewInvoicePage() {
  const t = await getTranslations("documents");

  return (
    <>
      <DashboardHeader title={t("newInvoice")} />
      <main className="flex-1 p-4 lg:p-8">
        <InvoiceForm />
      </main>
    </>
  );
}
