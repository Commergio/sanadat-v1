"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { useAdminLoading } from "@/components/admin/use-admin-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminClients, type AdminClientStatus } from "@/lib/mock-admin-data";
import { formatDate } from "@/lib/format";

export function AdminClientsContent() {
  const t = useTranslations("admin");
  const ts = useTranslations("dashboard.stats");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const loading = useAdminLoading();

  const filtered = useMemo(() => {
    return adminClients.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.includes(search) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(search);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const statusLabel = (status: AdminClientStatus) => {
    if (status === "active") return ts("active");
    if (status === "expired") return ts("expired");
    if (status === "expiring_soon") return t("expiringSoon");
    return t("suspended");
  };

  const statusVariant = (status: AdminClientStatus) => {
    if (status === "active") return "success" as const;
    if (status === "expired") return "warning" as const;
    if (status === "expiring_soon") return "warning" as const;
    return "destructive" as const;
  };

  const handleAction = (action: "activate" | "extend" | "suspend", name: string) => {
    toast.success(t("actionDemo", { action: t(action), client: name }));
  };

  if (loading) return <AdminTableSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchClient")}
            className="pe-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="me-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="active">{t("filterActive")}</SelectItem>
            <SelectItem value="expiring_soon">{t("filterExpiringSoon")}</SelectItem>
            <SelectItem value="expired">{t("filterExpired")}</SelectItem>
            <SelectItem value="suspended">{t("suspended")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState title={t("noClients")} description={t("noClientsDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("companyCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">
                    {t("emailCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("statusCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("expiryCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                    {t("documentsCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("actionsCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="max-w-[140px] px-3 py-3 font-medium sm:max-w-none sm:px-4">
                      <p className="truncate">{c.name}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell" dir="ltr">
                      {c.email}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      {formatDate(c.subscriptionExpires, locale)}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums lg:table-cell">{c.documentsCount}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex min-w-[140px] flex-col gap-1 sm:flex-row sm:flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                          onClick={() => handleAction("activate", c.name)}
                        >
                          {t("activate")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                          onClick={() => handleAction("extend", c.name)}
                        >
                          {t("extend")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive sm:h-9 sm:px-3 sm:text-sm"
                          onClick={() => handleAction("suspend", c.name)}
                        >
                          {t("suspend")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
