"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

const typeRoutes = {
  receipt_voucher: "/dashboard/receipts",
  payment_voucher: "/dashboard/payments",
  invoice: "/dashboard/invoices",
} as const;

export function RecentDocuments({
  documents,
}: {
  documents: DashboardStats["recentDocuments"];
}) {
  const t = useTranslations("dashboard");
  const tTable = useTranslations("dashboard.table");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("recent")}</CardTitle>
        <Link href="/dashboard/receipts" className="text-xs text-primary hover:underline">
          {t("viewAll")}
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`${typeRoutes[doc.type]}/${doc.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {doc.display_number.split("-")[0]?.charAt(0) ?? "D"}
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.display_number}</p>
                  <p className="text-xs text-muted-foreground">{doc.party_name}</p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-sm font-semibold">{formatCurrency(doc.amount, locale)}</p>
                <div className="flex items-center gap-2 mt-0.5 justify-end">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(doc.date, locale)}
                  </span>
                  {doc.status === "cancelled" && (
                    <Badge variant="destructive" className="text-[10px]">
                      {tTable("cancelled")}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
