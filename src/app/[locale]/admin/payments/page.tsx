"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_GATEWAYS } from "@/lib/constants";

const payments = [
  { id: "1", client: "Al-Nokhba Est.", gateway: "moyasar" as const, amount: 399, status: "completed", date: "2026-05-01" },
  { id: "2", client: "Amal Co.", gateway: "hyperpay" as const, amount: 399, status: "completed", date: "2026-05-18" },
  { id: "3", client: "Al-Otaibi Office", gateway: "stc_pay" as const, amount: 399, status: "pending", date: "2026-05-20" },
];

export default function AdminPaymentsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  return (
    <>
      <DashboardHeader title={t("payments")} />
      <main className="p-4 lg:p-8">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("clientCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("gatewayCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("amountCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("statusCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("dateCol")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.client}</td>
                  <td className="px-4 py-3">{PAYMENT_GATEWAYS[p.gateway]}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount, locale)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "completed" ? "success" : "warning"}>
                      {p.status === "completed" ? t("completed") : t("pending")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.date, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
