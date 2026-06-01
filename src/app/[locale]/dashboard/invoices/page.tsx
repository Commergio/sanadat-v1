"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { emptyInvoicesList } from "@/lib/placeholders/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { Search, Plus, Eye } from "lucide-react";
import { useMemo, useState } from "react";

export default function InvoicesPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return emptyInvoicesList;
    return emptyInvoicesList.filter(
      (inv) =>
        inv.party_name.includes(search) ||
        inv.display_number.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <>
      <DashboardHeader title={t("invoices")} />
      <main className="flex-1 space-y-4 p-4 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.search")}
              className="h-9 bg-muted/40 pe-10 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/invoices/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("newInvoice")}
            </Button>
          </Link>
        </div>

        <div className="dashboard-card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title={search ? t("emptySearchTitle") : t("emptyDocsTitle")}
              description={search ? t("emptySearchDesc") : t("emptyDocsDesc")}
              variant={search ? "search" : "documents"}
              actionLabel={`+ ${t("newInvoice")}`}
              actionHref="/dashboard/invoices/new"
              className="border-0 bg-transparent"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">{t("table.number")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("invoiceTable.client")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("table.amount")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("invoiceTable.paymentStatus")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("table.date")}</th>
                    <th className="w-12 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className="group border-b border-border/50 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium">{inv.display_number}</td>
                      <td className="max-w-[200px] px-4 py-3">
                        <p className="truncate">{inv.party_name}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {formatCurrency(inv.amount, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={inv.payment_status === "paid" ? "success" : "warning"}
                          className="text-[10px] font-medium"
                        >
                          {inv.payment_status === "paid"
                            ? t("invoiceTable.paid")
                            : t("invoiceTable.unpaid")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(inv.date, locale)}
                      </td>
                      <td className="px-2 py-3">
                        <Link href={`/dashboard/invoices/${inv.id}`}>
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
      </main>
    </>
  );
}
