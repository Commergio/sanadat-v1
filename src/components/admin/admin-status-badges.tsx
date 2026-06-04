"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CompanyAccountStatus } from "@/application/platform/types";
import type { SubscriptionStatus } from "@/lib/types";

export function AccountStatusBadge({ status }: { status: CompanyAccountStatus }) {
  const t = useTranslations("admin");
  return (
    <Badge variant={status === "active" ? "success" : "destructive"}>
      {status === "active" ? t("accountActive") : t("suspended")}
    </Badge>
  );
}

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus | null | undefined;
}) {
  const t = useTranslations("admin");
  const ts = useTranslations("dashboard.stats");

  if (!status) {
    return <Badge variant="outline">—</Badge>;
  }

  const label =
    status === "active"
      ? ts("active")
      : status === "trialing"
        ? t("trialing")
        : status === "expired"
          ? ts("expired")
          : status === "suspended"
            ? ts("suspended")
            : status === "cancelled"
              ? t("cancelled")
              : status;

  const variant =
    status === "active"
      ? "success"
      : status === "trialing"
        ? "secondary"
        : status === "cancelled" || status === "suspended"
          ? "destructive"
          : "warning";

  return <Badge variant={variant}>{label}</Badge>;
}
