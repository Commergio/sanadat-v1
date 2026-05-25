"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockInvoices = [
  { id: "1", display_number: "INV-042", party_name: "Modern Building Est.", amount: 28500, date: "2026-05-19", status: "active" as const, payment_status: "unpaid" as const },
  { id: "2", display_number: "INV-041", party_name: "Tech Corp", amount: 12000, date: "2026-05-12", status: "active" as const, payment_status: "paid" as const },
];

export default function InvoicesPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <>
      <DashboardHeader title={t("invoices")} />
      <main className="flex-1 p-4 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("table.search")} className="pe-10" />
          </div>
          <Link href="/dashboard/invoices/new">
            <Button>+ {t("newInvoice")}</Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("table.number")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("invoiceTable.client")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("table.amount")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("invoiceTable.paymentStatus")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("table.date")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{inv.display_number}</td>
                  <td className="px-4 py-3">{inv.party_name}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(inv.amount, locale)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.payment_status === "paid" ? "success" : "warning"}>
                      {inv.payment_status === "paid" ? t("invoiceTable.paid") : t("invoiceTable.unpaid")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.date, locale)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm">{t("invoiceTable.view")}</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
