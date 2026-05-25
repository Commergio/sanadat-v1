"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminNotificationsPage() {
  const t = useTranslations("admin");

  return (
    <>
      <DashboardHeader title={t("notifications")} />
      <main className="p-4 lg:p-8 max-w-2xl space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{t("expiryNotify")}</h3>
            <p className="text-sm text-muted-foreground">{t("expiryAuto")}</p>
            <Button>{t("sendManual")}</Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
