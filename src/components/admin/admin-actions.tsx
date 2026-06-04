"use client";

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { usePlatformActions } from "@/hooks/use-platform-admin";
import { formatDate } from "@/lib/format";

export function AdminActionsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, loading, error, refresh } = usePlatformActions({ page, limit: 20 });

  if (loading && !data) return <AdminTableSkeleton rows={6} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />

      {items.length === 0 && !loading ? (
        <AdminEmptyState title={t("noActions")} description={t("noActionsDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("actionCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("entityTypeCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("entityIdCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("adminUserCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("dateCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("metadataCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className="border-b border-border/60 last:border-0 hover:bg-muted/20 align-top"
                    >
                      <td className="px-3 py-3 font-medium sm:px-4">{row.action}</td>
                      <td className="px-3 py-3 sm:px-4">{row.entityType}</td>
                      <td className="hidden px-4 py-3 font-mono text-xs md:table-cell" dir="ltr">
                        {row.entityId}
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs lg:table-cell" dir="ltr">
                        {row.adminUserId.slice(0, 8)}…
                      </td>
                      <td className="px-3 py-3 text-muted-foreground sm:px-4">
                        {formatDate(row.createdAt, locale)}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() =>
                            setExpandedId(expandedId === row.id ? null : row.id)
                          }
                        >
                          {expandedId === row.id ? t("hide") : t("show")}
                        </button>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr key={`${row.id}-meta`} className="bg-muted/20">
                        <td colSpan={6} className="px-4 py-3">
                          <pre
                            className="overflow-x-auto rounded bg-muted/40 p-2 text-xs"
                            dir="ltr"
                          >
                            {JSON.stringify(row.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
