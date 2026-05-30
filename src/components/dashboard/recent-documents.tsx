"use client";

import { useMemo, useState } from "react";
import { Search, ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeRoutes = {
  receipt_voucher: "/dashboard/receipts",
  payment_voucher: "/dashboard/payments",
  invoice: "/dashboard/invoices",
} as const;

const typeIcons = {
  receipt_voucher: ArrowDownLeft,
  payment_voucher: ArrowUpRight,
  invoice: FileText,
};

type StatusFilter = "all" | "active" | "cancelled";

export function RecentDocuments({
  documents,
}: {
  documents: DashboardStats["recentDocuments"];
}) {
  const t = useTranslations("dashboard");
  const tTable = useTranslations("dashboard.table");
  const tDoc = useTranslations("documents");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const typeLabels = {
    receipt_voucher: tDoc("receipt"),
    payment_voucher: tDoc("payment"),
    invoice: tDoc("invoice"),
  };

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        doc.party_name.toLowerCase().includes(q) ||
        doc.display_number.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: tTable("active") },
    { key: "cancelled", label: tTable("cancelled") },
  ];

  return (
    <DashboardSection
      title={t("recent")}
      action={
        <Link
          href="/dashboard/receipts"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t("viewAll")}
        </Link>
      }
      className="h-full"
    >
      <div className="dashboard-card flex h-full min-h-[380px] flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tTable("search")}
              className="h-9 border-0 bg-muted/40 pe-10 shadow-none focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
            {filters.map((f) => (
              <Button
                key={f.key}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 rounded-md px-2.5 text-xs font-medium",
                  statusFilter === f.key && "bg-background shadow-sm text-foreground"
                )}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <EmptyState
              title={search ? t("emptySearchTitle") : t("emptyRecentTitle")}
              description={search ? t("emptySearchDesc") : t("emptyRecentDesc")}
              variant={search ? "search" : "documents"}
              actionLabel={t("newReceipt")}
              actionHref="/dashboard/receipts/new"
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                <tr className="border-b border-border/80 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-start font-medium">{tTable("number")}</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium sm:table-cell">
                    {t("type")}
                  </th>
                  <th className="px-4 py-2.5 text-start font-medium">{tTable("amount")}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{tTable("status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const TypeIcon = typeIcons[doc.type];
                  return (
                    <tr
                      key={doc.id}
                      className="group border-b border-border/50 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`${typeRoutes[doc.type]}/${doc.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-primary group-hover:bg-primary/10">
                            <TypeIcon className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{doc.display_number}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doc.party_name}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                        {typeLabels[doc.type]}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold tabular-nums">
                          {formatCurrency(doc.amount, locale)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(doc.date, locale)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={doc.status === "active" ? "success" : "destructive"}
                          className="text-[10px] font-medium"
                        >
                          {doc.status === "active" ? tTable("active") : tTable("cancelled")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
