"use client";

import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminInvitationCodesContent } from "@/components/admin/admin-invitation-codes";

export default function AdminInvitationCodesPage() {
  const t = useTranslations("admin");

  return (
    <>
      <AdminHeader
        title={t("invitationCodesNav")}
        description={t("invitationCodesDesc")}
      />
      <main className="flex-1 p-4 lg:p-8">
        <AdminInvitationCodesContent />
      </main>
    </>
  );
}
