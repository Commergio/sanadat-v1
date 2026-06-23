"use client";

import { useTranslations } from "next-intl";
import { AdminReadOnlyHint } from "@/components/admin/admin-read-only-hint";
import { Input } from "@/components/ui/input";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_E164 } from "@/lib/constants";
import { Label } from "@/components/ui/label";

export function AdminSettingsContent() {
  const t = useTranslations("admin");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminReadOnlyHint />

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <p className="text-sm font-semibold">{t("settingsPlatform")}</p>
          <p className="text-xs text-muted-foreground">{t("settingsPlatformDesc")}</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <Label>{t("platformName")}</Label>
            <Input defaultValue="سندات" readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label>{t("supportEmail")}</Label>
            <Input
              defaultValue={SUPPORT_EMAIL}
              dir="ltr"
              className="text-start"
              readOnly
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>{t("supportPhone")}</Label>
            <Input
              defaultValue={SUPPORT_WHATSAPP_E164}
              dir="ltr"
              className="text-start font-mono"
              readOnly
              disabled
            />
          </div>
        </div>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <p className="text-sm font-semibold">{t("settingsNotifications")}</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <label className="flex cursor-not-allowed items-center justify-between gap-4 opacity-60">
            <div>
              <p className="text-sm font-medium">{t("expiryNotify")}</p>
              <p className="text-xs text-muted-foreground">{t("expiryAuto")}</p>
            </div>
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex cursor-not-allowed items-center justify-between gap-4 opacity-60">
            <div>
              <p className="text-sm font-medium">{t("paymentNotify")}</p>
              <p className="text-xs text-muted-foreground">{t("paymentNotifyDesc")}</p>
            </div>
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 accent-primary" />
          </label>
        </div>
      </section>
    </div>
  );
}
