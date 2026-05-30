"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePaymentMethods } from "@/hooks/use-translated-constants";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DocumentRow {
  id: string;
  display_number: string;
  party_name: string;
  amount: number;
  date: string;
  status: "active" | "cancelled";
  payment_method: PaymentMethod;
}

type StatusFilter = "all" | "active" | "cancelled";

interface DocumentsTableProps {
  documents: DocumentRow[];
  basePath: string;
  createHref: string;
  createLabel: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DocumentsTable({
  documents,
  basePath,
  createHref,
  createLabel,
  emptyTitle,
  emptyDescription,
}: DocumentsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const t = useTranslations("dashboard");
  const tTable = useTranslations("dashboard.table");
  const locale = useLocale();
  const paymentMethods = usePaymentMethods();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter((d) => {
      const matchesSearch =
        !search ||
        d.party_name.toLowerCase().includes(q) ||
        d.display_number.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: tTable("active") },
    { key: "cancelled", label: tTable("cancelled") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tTable("search")}
            className="h-9 bg-muted/40 pe-10 shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Link href={createHref}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {createLabel}
            </Button>
          </Link>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={
              search || statusFilter !== "all"
                ? t("emptySearchTitle")
                : (emptyTitle ?? t("emptyDocsTitle"))
            }
            description={
              search || statusFilter !== "all"
                ? t("emptySearchDesc")
                : (emptyDescription ?? t("emptyDocsDesc"))
            }
            variant={search ? "search" : "documents"}
            actionLabel={createLabel}
            actionHref={createHref}
            className="border-0 bg-transparent"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{tTable("number")}</th>
                  <th className="px-4 py-3 text-start font-medium">{tTable("party")}</th>
                  <th className="px-4 py-3 text-start font-medium">{tTable("amount")}</th>
                  <th className="hidden px-4 py-3 text-start font-medium md:table-cell">
                    {tTable("date")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">
                    {tTable("payment")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">{tTable("status")}</th>
                  <th className="w-12 px-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group border-b border-border/50 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{doc.display_number}</p>
                    </td>
                    <td className="max-w-[180px] px-4 py-3">
                      <p className="truncate">{doc.party_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold tabular-nums">
                        {formatCurrency(doc.amount, locale)}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatDate(doc.date, locale)}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                      {paymentMethods[doc.payment_method]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={doc.status === "active" ? "success" : "destructive"}
                        className="text-[10px] font-medium"
                      >
                        {doc.status === "active" ? tTable("active") : tTable("cancelled")}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`${basePath}/${doc.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-60 group-hover:opacity-100"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
