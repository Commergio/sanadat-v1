"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const subs = [
  { client: "Al-Nokhba Est.", status: "active", expires: "2026-08-15", autoRenew: true },
  { client: "Amal Co.", status: "active", expires: "2026-06-20", autoRenew: true },
  { client: "Al-Otaibi Office", status: "expired", expires: "2026-04-01", autoRenew: false },
];

export default function AdminSubscriptionsPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("dashboard.stats");
  const locale = useLocale();

  return (
    <>
      <DashboardHeader title={t("subscriptions")} />
      <main className="p-4 lg:p-8">
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("clientCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("statusCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("expiryCol")}</th>
                <th className="px-4 py-3 text-start text-muted-foreground font-medium">{t("autoRenewCol")}</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.client}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "active" ? "success" : "warning"}>
                      {s.status === "active" ? ts("active") : ts("expired")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(s.expires, locale)}</td>
                  <td className="px-4 py-3">{s.autoRenew ? t("yes") : t("no")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
