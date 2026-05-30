"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { useAdminLoading } from "@/components/admin/use-admin-loading";
import { adminPayments } from "@/lib/mock-admin-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_GATEWAYS } from "@/lib/constants";

export function AdminPaymentsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const loading = useAdminLoading();

  const methodLabel = (method: string) => {
    const key = method as keyof typeof PAYMENT_GATEWAYS;
    return PAYMENT_GATEWAYS[key] ?? method.toUpperCase();
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return t("completed");
    if (status === "pending") return t("pending");
    return t("failed");
  };

  const statusVariant = (status: string) => {
    if (status === "completed") return "success" as const;
    if (status === "pending") return "warning" as const;
    return "destructive" as const;
  };

  if (loading) return <AdminTableSkeleton rows={5} />;

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30">
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("transactionCol")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("clientCol")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("amountCol")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("statusCol")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("methodCol")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("dateCol")}
              </th>
            </tr>
          </thead>
          <tbody>
            {adminPayments.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                  {p.transactionId}
                </td>
                <td className="px-4 py-3 font-medium">{p.clientName}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {formatCurrency(p.amount, locale)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                </td>
                <td className="px-4 py-3">{methodLabel(p.method)}</td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {formatDate(p.date, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
