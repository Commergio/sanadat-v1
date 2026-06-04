"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X, Info, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  markTenantAnnouncementRead,
  useTenantAnnouncements,
} from "@/hooks/use-announcements";
import type { AnnouncementPriority } from "@/application/announcements/types";
import { cn } from "@/lib/utils";

const priorityStyles: Record<
  AnnouncementPriority,
  { border: string; bg: string; icon: typeof Info }
> = {
  info: {
    border: "border-blue-200/80 dark:border-blue-900/60",
    bg: "bg-blue-50/90 dark:bg-blue-950/40",
    icon: Info,
  },
  warning: {
    border: "border-amber-200/80 dark:border-amber-900/60",
    bg: "bg-amber-50/90 dark:bg-amber-950/40",
    icon: AlertTriangle,
  },
  success: {
    border: "border-emerald-200/80 dark:border-emerald-900/60",
    bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
    icon: CheckCircle2,
  },
  critical: {
    border: "border-red-200/80 dark:border-red-900/60",
    bg: "bg-red-50/90 dark:bg-red-950/40",
    icon: AlertOctagon,
  },
};

export function AnnouncementBanners() {
  const t = useTranslations("dashboard.announcements");
  const locale = useLocale();
  const { items, loading, refresh } = useTenantAnnouncements();

  const unread = useMemo(() => items.filter((a) => !a.read), [items]);

  if (loading || unread.length === 0) return null;

  const dismiss = async (id: string) => {
    try {
      await markTenantAnnouncementRead(id);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message ?? t("dismissFailed"));
    }
  };

  return (
    <div className="space-y-3">
      {unread.map((item) => {
        const style = priorityStyles[item.priority];
        const Icon = style.icon;
        const title = locale === "ar" ? item.titleAr : item.titleEn;
        const content = locale === "ar" ? item.contentAr : item.contentEn;

        return (
          <div
            key={item.id}
            className={cn(
              "flex gap-3 rounded-xl border p-4 shadow-sm",
              style.border,
              style.bg
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5 opacity-80" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={t("dismiss")}
              onClick={() => void dismiss(item.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
