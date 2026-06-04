"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminAnnouncementsContent } from "@/components/admin/admin-announcements";
import { useTranslations } from "next-intl";

export default function AdminAnnouncementsPage() {
  const t = useTranslations("admin.announcements");

  return (
    <>
      <AdminHeader title={t("pageTitle")} description={t("pageDesc")} />
      <main className="flex-1 p-4 lg:p-8">
        <AdminAnnouncementsContent />
      </main>
    </>
  );
}
