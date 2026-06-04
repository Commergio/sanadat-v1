"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { usePlatformPayments } from "@/hooks/use-platform-admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type { PaymentStatus } from "@/lib/types";

type PayFilter = "all" | PaymentStatus;

export function AdminPaymentsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [filter, setFilter] = useState<PayFilter>("all");
  const [page, setPage] = useState(1);

  const paymentStatus = filter === "all" ? undefined : filter;

  const { data, loading, error, refresh } = usePlatformPayments({
    paymentStatus,
    page,
    limit: 20,
  });

  const statusLabel = (status: string) => {
    if (status === "completed") return t("completed");
    if (status === "pending") return t("pending");
    if (status === "refunded") return t("refunded");
    return t("failed");
  };

  const statusVariant = (status: string) => {
    if (status === "completed") return "success" as const;
    if (status === "pending") return "warning" as const;
    if (status === "refunded") return "secondary" as const;
    return "destructive" as const;
  };

  if (loading && !data) return <AdminTableSkeleton rows={5} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />

      <div className="flex flex-wrap gap-2">
        {(["all", "completed", "pending", "failed", "refunded"] as const).map((key) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(key);
              setPage(1);
            }}
          >
            {key === "all" ? t("filterAll") : statusLabel(key)}
          </Button>
        ))}
      </div>

      {items.length === 0 && !loading ? (
        <AdminEmptyState title={t("noPayments")} description={t("noPaymentsDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("clientCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("amountCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("statusCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("gatewayCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("paidAtCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("failedAtCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">
                    {t("referenceCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="max-w-[140px] px-3 py-3 font-medium sm:px-4">
                      {p.companyName ? (
                        <Link
                          href={`/admin/clients/${p.companyId}`}
                          className="truncate hover:text-primary hover:underline"
                        >
                          {p.companyName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{p.companyId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums sm:px-4">
                      {formatCurrency(p.amount, locale)} {p.currency}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{p.gateway}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground tabular-nums lg:table-cell">
                      {p.paidAt ? formatDate(p.paidAt, locale) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground tabular-nums lg:table-cell">
                      {p.failedAt ? formatDate(p.failedAt, locale) : "—"}
                    </td>
                    <td
                      className="hidden px-4 py-3 font-mono text-xs xl:table-cell"
                      dir="ltr"
                    >
                      {p.gatewayReference ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="border-t border-border/80 px-4 py-3">
              <AdminPagination
                page={data.page}
                limit={data.limit}
                total={data.total}
                onPageChange={setPage}
                labels={{ prev: t("pagePrev"), next: t("pageNext"), page: t("pageLabel") }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
