import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { VoucherForm } from "@/components/documents/voucher-form";

export default async function NewPaymentPage() {
  const t = await getTranslations("documents");

  return (
    <>
      <DashboardHeader title={t("newPayment")} />
      <main className="flex-1 p-4 lg:p-8">
        <VoucherForm type="payment" redirectPath="/dashboard/payments" />
      </main>
    </>
  );
}
