"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/format";

const clients = [
  { id: "1", name: "Al-Nokhba Trading", email: "info@nokhba.sa", status: "active", expires: "2026-08-15" },
  { id: "2", name: "Amal Contracting", email: "contact@amal.sa", status: "active", expires: "2026-06-20" },
  { id: "3", name: "Al-Otaibi Office", email: "office@otaibi.sa", status: "expired", expires: "2026-04-01" },
  { id: "4", name: "Logistics Supplier", email: "sales@logistics.sa", status: "suspended", expires: "2026-05-10" },
];

export default function AdminClientsPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("dashboard.stats");
  const locale = useLocale();

  const statusLabel = (status: string) => {
    if (status === "active") return ts("active");
    if (status === "expired") return ts("expired");
    return t("suspended");
  };

  return (
    <>
      <DashboardHeader title={t("clients")} />
      <main className="p-4 lg:p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("searchClient")} className="pe-10" />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("companyCol")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("emailCol")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("statusCol")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("expiryCol")}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t("actionsCol")}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {c.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        c.status === "active"
                          ? "success"
                          : c.status === "expired"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {statusLabel(c.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(c.expires, locale)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        {t("activate")}
                      </Button>
                      <Button variant="outline" size="sm">
                        {t("extend")}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        {t("suspend")}
                      </Button>
                    </div>
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
