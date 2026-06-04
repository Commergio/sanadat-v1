"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminActionsContent } from "@/components/admin/admin-actions";
import { useTranslations } from "next-intl";

export default function AdminActionsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("actionsNav")} description={t("actionsDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminActionsContent />
      </main>
    </>
  );
}
