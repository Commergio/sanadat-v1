"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSettingsSkeleton } from "@/components/admin/admin-loading";
import { useAdminLoading } from "@/components/admin/use-admin-loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminSettingsContent() {
  const t = useTranslations("admin");
  const loading = useAdminLoading();

  if (loading) return <AdminSettingsSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <p className="text-sm font-semibold">{t("settingsPlatform")}</p>
          <p className="text-xs text-muted-foreground">{t("settingsPlatformDesc")}</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <Label>{t("platformName")}</Label>
            <Input defaultValue="سندات" />
          </div>
          <div className="space-y-2">
            <Label>{t("supportEmail")}</Label>
            <Input defaultValue="support@sanadat.sa" dir="ltr" className="text-start" />
          </div>
          <div className="space-y-2">
            <Label>{t("supportPhone")}</Label>
            <Input defaultValue="966500000000" dir="ltr" className="text-start font-mono" />
          </div>
        </div>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <p className="text-sm font-semibold">{t("settingsNotifications")}</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("expiryNotify")}</p>
              <p className="text-xs text-muted-foreground">{t("expiryAuto")}</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("paymentNotify")}</p>
              <p className="text-xs text-muted-foreground">{t("paymentNotifyDesc")}</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          </label>
        </div>
      </section>

      <Button className="gap-2" onClick={() => toast.success(t("settingsSaved"))}>
        <Save className="h-4 w-4" />
        {t("saveSettings")}
      </Button>
    </div>
  );
}
