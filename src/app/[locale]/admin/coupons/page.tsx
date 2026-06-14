"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminCouponsContent } from "@/components/admin/admin-coupons";
import { useTranslations } from "next-intl";

export default function AdminCouponsPage() {
  const t = useTranslations("admin.coupons");

  return (
    <>
      <AdminHeader title={t("pageTitle")} description={t("pageDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminCouponsContent />
      </main>
    </>
  );
}
