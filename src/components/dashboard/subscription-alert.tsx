"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EXPIRY_NOTIFICATION_DAYS } from "@/lib/constants";

interface SubscriptionAlertProps {
  daysUntilExpiry: number;
}

export function SubscriptionAlert({ daysUntilExpiry }: SubscriptionAlertProps) {
  const t = useTranslations("dashboard.subscriptionAlert");

  const shouldAlert = EXPIRY_NOTIFICATION_DAYS.some(
    (d) => daysUntilExpiry <= d
  );

  if (!shouldAlert) return null;

  const daysLabel = daysUntilExpiry === 1 ? t("day") : t("days");

  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {t("title", { days: daysUntilExpiry, daysLabel })}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
          {t("hint")}
        </p>
      </div>
      <Link href="/dashboard/subscription">
        <Button size="sm" variant="outline" className="border-amber-300 shrink-0">
          {t("renew")}
        </Button>
      </Link>
    </div>
  );
}
