"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Filter, Search } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { SupportPriorityBadge, SupportStatusBadge } from "@/components/support/support-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlatformSupportTickets } from "@/hooks/use-support";
import { usePlatformCompanies } from "@/hooks/use-platform-admin";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/application/support/types";

export function AdminSupportContent() {
  const t = useTranslations("admin.support");
  const tAdmin = useTranslations("admin");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const status =
    statusFilter !== "all" ? (statusFilter as SupportTicketStatus) : undefined;
  const priority =
    priorityFilter !== "all" ? (priorityFilter as SupportTicketPriority) : undefined;
  const companyId = companyFilter !== "all" ? companyFilter : undefined;

  const { data, loading, error, refresh } = usePlatformSupportTickets({
    page,
    search: search || undefined,
    status,
    priority,
    companyId,
    limit: 20,
  });

  const { data: companiesData } = usePlatformCompanies({
    page: 1,
    limit: 100,
  });

  const companyOptions = companiesData?.items ?? [];

  if (loading && !data) return <AdminTableSkeleton rows={8} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner
        error={error}
        onRetry={() => void refresh()}
        retryLabel={t("retry")}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pe-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="me-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="open">{t("status_open")}</SelectItem>
            <SelectItem value="in_progress">{t("status_in_progress")}</SelectItem>
            <SelectItem value="resolved">{t("status_resolved")}</SelectItem>
            <SelectItem value="closed">{t("status_closed")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t("filterPriority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="low">{t("priority_low")}</SelectItem>
            <SelectItem value="normal">{t("priority_normal")}</SelectItem>
            <SelectItem value="high">{t("priority_high")}</SelectItem>
            <SelectItem value="urgent">{t("priority_urgent")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={companyFilter}
          onValueChange={(v) => {
            setCompanyFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={t("filterCompany")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllCompanies")}</SelectItem>
            {companyOptions.map((c) => (
              <SelectItem key={c.companyId} value={c.companyId}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <AdminEmptyState title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{t("subjectCol")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("companyCol")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("statusCol")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("priorityCol")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("updatedCol")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("viewCol")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.companyName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SupportStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SupportPriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(ticket.updatedAt, locale)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/support/${ticket.id}`}>{t("view")}</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminPagination
        page={page}
        total={data?.total ?? 0}
        limit={data?.limit ?? 20}
        onPageChange={setPage}
        labels={{
          prev: tAdmin("pagePrev"),
          next: tAdmin("pageNext"),
          page: tAdmin("pageLabel"),
        }}
      />
    </div>
  );
}
