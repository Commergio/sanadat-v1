"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminWhatsappPage() {
  const t = useTranslations("admin");

  const templates = [
    { name: t("templateReceipt"), body: t("templateReceiptBody") },
    { name: t("templateSubscription"), body: t("templateSubscriptionBody") },
  ];

  return (
    <>
      <DashboardHeader title={t("whatsapp")} />
      <main className="p-4 lg:p-8 space-y-4 max-w-2xl">
        {templates.map((tpl) => (
          <Card key={tpl.name}>
            <CardHeader>
              <CardTitle className="text-base">{tpl.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">{tpl.body}</p>
              <Button variant="outline" size="sm" className="mt-4">
                {t("edit")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
