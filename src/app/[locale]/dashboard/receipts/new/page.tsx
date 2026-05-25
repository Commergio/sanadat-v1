import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { VoucherForm } from "@/components/documents/voucher-form";

export default async function NewReceiptPage() {
  const t = await getTranslations("documents");

  return (
    <>
      <DashboardHeader title={t("newReceipt")} />
      <main className="flex-1 p-4 lg:p-8">
        <VoucherForm type="receipt" redirectPath="/dashboard/receipts" />
      </main>
    </>
  );
}
