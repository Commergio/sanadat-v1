"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSubscriptionsContent } from "@/components/admin/admin-subscriptions";

export default function AdminSubscriptionsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("subscriptions")} description={t("subscriptionsDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminSubscriptionsContent />
      </main>
    </>
  );
}
