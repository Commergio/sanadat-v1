"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminMessagesContent } from "@/components/admin/admin-messages";

export default function AdminMessagesPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader title={t("messages")} description={t("messagesDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminMessagesContent />
      </main>
    </>
  );
}
