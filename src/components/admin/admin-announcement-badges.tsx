"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { AnnouncementPriority } from "@/application/announcements/types";

export function AnnouncementPriorityBadge({
  priority,
}: {
  priority: AnnouncementPriority;
}) {
  const t = useTranslations("admin.announcements");

  const variant =
    priority === "critical"
      ? "destructive"
      : priority === "warning"
        ? "warning"
        : priority === "success"
          ? "success"
          : "secondary";

  return <Badge variant={variant}>{t(`priority_${priority}`)}</Badge>;
}

export function AnnouncementStatusBadge({
  published,
  isActive,
}: {
  published: boolean;
  isActive: boolean;
}) {
  const t = useTranslations("admin.announcements");

  if (!published) {
    return <Badge variant="outline">{t("statusDraft")}</Badge>;
  }
  if (isActive) {
    return <Badge variant="success">{t("statusActive")}</Badge>;
  }
  return <Badge variant="warning">{t("statusInactive")}</Badge>;
}
