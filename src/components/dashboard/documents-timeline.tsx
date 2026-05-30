"use client";

import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeRoutes = {
  receipt_voucher: "/dashboard/receipts",
  payment_voucher: "/dashboard/payments",
  invoice: "/dashboard/invoices",
} as const;

const typeConfig = {
  receipt_voucher: {
    icon: ArrowDownLeft,
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  payment_voucher: {
    icon: ArrowUpRight,
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  invoice: {
    icon: FileText,
    dot: "bg-violet-500",
    ring: "ring-violet-500/20",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

export function DocumentsTimeline({
  documents,
}: {
  documents: DashboardStats["recentDocuments"];
}) {
  const t = useTranslations("dashboard");
  const tTable = useTranslations("dashboard.table");
  const tDoc = useTranslations("documents");
  const locale = useLocale();

  const typeLabels = {
    receipt_voucher: tDoc("receipt"),
    payment_voucher: tDoc("payment"),
    invoice: tDoc("invoice"),
  };

  const sorted = [...documents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <DashboardSection
      title={t("timelineTitle")}
      description={t("timelineDesc")}
      action={
        <Link href="/dashboard/receipts" className="text-xs font-medium text-primary hover:underline">
          {t("viewAll")}
        </Link>
      }
    >
      <div className="dashboard-card divide-y divide-border/60">
        {sorted.map((doc, index) => {
          const config = typeConfig[doc.type];
          const TypeIcon = config.icon;
          const isLast = index === sorted.length - 1;

          return (
            <Link
              key={doc.id}
              href={`${typeRoutes[doc.type]}/${doc.id}`}
              className="group relative flex gap-4 p-4 transition-colors hover:bg-muted/30 sm:p-5"
            >
              <div className="relative flex flex-col items-center pt-0.5">
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-xl ring-4",
                    config.ring,
                    "bg-card"
                  )}
                >
                  <TypeIcon className={cn("h-4 w-4", config.iconColor)} strokeWidth={1.75} />
                </div>
                {!isLast && (
                  <div className="mt-1 w-px flex-1 min-h-[24px] bg-border" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold",
                          config.badge
                        )}
                      >
                        {typeLabels[doc.type]}
                      </span>
                      <Badge
                        variant={doc.status === "active" ? "success" : "destructive"}
                        className="text-[10px] font-medium"
                      >
                        {doc.status === "active" ? tTable("active") : tTable("cancelled")}
                      </Badge>
                    </div>
                    <p className="mt-1.5 font-semibold tracking-tight group-hover:text-primary">
                      {doc.display_number}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{doc.party_name}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-bold tabular-nums tracking-tight">
                      {formatCurrency(doc.amount, locale)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(doc.date, locale)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardSection>
  );
}
