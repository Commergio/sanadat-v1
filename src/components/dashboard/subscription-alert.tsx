"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPIRY_NOTIFICATION_DAYS } from "@/lib/constants";

interface SubscriptionAlertProps {
  daysUntilExpiry: number;
}

export function SubscriptionAlert({ daysUntilExpiry }: SubscriptionAlertProps) {
  const shouldAlert = EXPIRY_NOTIFICATION_DAYS.some(
    (d) => daysUntilExpiry <= d
  );

  if (!shouldAlert) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          ينتهي اشتراكك خلال {daysUntilExpiry} {daysUntilExpiry === 1 ? "يوم" : "أيام"}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
          جدّد اشتراكك لتجنب تعطيل الحساب
        </p>
      </div>
      <Link href="/ar/dashboard/subscription">
        <Button size="sm" variant="outline" className="border-amber-300 shrink-0">
          تجديد
        </Button>
      </Link>
    </div>
  );
}
