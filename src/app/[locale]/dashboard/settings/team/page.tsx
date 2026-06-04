"use client";

import { useLocale } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { TeamManagementPanel } from "@/components/settings/team-management-panel";

export default function TeamSettingsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <>
      <DashboardHeader
        title={isAr ? "إدارة الفريق" : "Team Management"}
        description={
          isAr
            ? "إدارة أعضاء المنشأة والدعوات المعلقة والأدوار"
            : "Manage company members, invitations, and roles"
        }
      />
      <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8">
        <TeamManagementPanel />
      </main>
    </>
  );
}
