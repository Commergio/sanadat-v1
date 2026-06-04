"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Filter } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AccountStatusBadge,
  SubscriptionStatusBadge,
} from "@/components/admin/admin-status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlatformCompanies } from "@/hooks/use-platform-admin";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type { CompanyAccountStatus } from "@/application/platform/types";
import type { SubscriptionStatus } from "@/lib/types";

export function AdminClientsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const status =
    accountFilter === "active" || accountFilter === "suspended"
      ? (accountFilter as CompanyAccountStatus)
      : undefined;

  const subscriptionStatus =
    subscriptionFilter !== "all" ? (subscriptionFilter as SubscriptionStatus) : undefined;

  const { data, loading, error, refresh } = usePlatformCompanies({
    search: search || undefined,
    status,
    subscriptionStatus,
    page,
    limit: 20,
  });

  if (loading && !data) return <AdminTableSkeleton rows={6} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchClient")}
            className="pe-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={accountFilter}
          onValueChange={(v) => {
            setAccountFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="me-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t("filterAccountStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="active">{t("accountActive")}</SelectItem>
            <SelectItem value="suspended">{t("suspended")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={subscriptionFilter}
          onValueChange={(v) => {
            setSubscriptionFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("filterSubscriptionStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="active">{t("filterActive")}</SelectItem>
            <SelectItem value="trialing">{t("trialing")}</SelectItem>
            <SelectItem value="expired">{t("filterExpired")}</SelectItem>
            <SelectItem value="suspended">{t("suspended")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 && !loading ? (
        <AdminEmptyState title={t("noClients")} description={t("noClientsDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("companyCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">
                    {t("emailCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("accountStatusCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("statusCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("expiryCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("documentsCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("viewCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.companyId}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="max-w-[140px] px-3 py-3 font-medium sm:max-w-none sm:px-4">
                      <p className="truncate">{c.companyName}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell" dir="ltr">
                      {c.ownerEmail ?? "—"}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <AccountStatusBadge status={c.accountStatus} />
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <SubscriptionStatusBadge status={c.subscriptionStatus} />
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      {c.subscriptionExpiresAt
                        ? formatDate(c.subscriptionExpiresAt, locale)
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums lg:table-cell">
                      {c.documentsCount}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <Link href={`/admin/clients/${c.companyId}`}>
                        <Button variant="outline" size="sm">
                          {t("viewDetail")}
                        </Button>
                      </Link>
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
