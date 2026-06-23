"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminReadOnlyHint } from "@/components/admin/admin-read-only-hint";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  AccountStatusBadge,
  SubscriptionStatusBadge,
} from "@/components/admin/admin-status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  extendPlatformSubscription,
  setPlatformCompanyStatus,
  usePlatformCompany,
  usePlatformSession,
} from "@/hooks/use-platform-admin";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { PlatformApiError } from "@/lib/platform/api-client";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";

interface AdminCompanyDetailProps {
  companyId: string;
}

type PendingAction = "suspend" | "reactivate" | "extend" | null;

function toastApiError(err: unknown, fallback: string) {
  const e = err as PlatformApiError;
  toast.error(e.message ?? fallback);
}

export function AdminCompanyDetail({ companyId }: AdminCompanyDetailProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { canManage } = usePlatformSession();
  const { company, trialUsage, promoRedemptions, payments, companyActions, loading, error, refresh } =
    usePlatformCompany(companyId);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [extendDate, setExtendDate] = useState("");
  const [reason, setReason] = useState("");

  const paymentSummary = useMemo(() => {
    let completedTotal = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    for (const p of payments) {
      if (p.status === "completed") {
        completedTotal += p.amount;
        completedCount += 1;
      } else if (p.status === "pending") {
        pendingCount += 1;
      } else if (p.status === "failed") {
        failedCount += 1;
      }
    }
    return { completedTotal, completedCount, pendingCount, failedCount };
  }, [payments]);

  const paymentStatusLabel = (status: string) => {
    if (status === "completed") return t("completed");
    if (status === "pending") return t("pending");
    if (status === "refunded") return t("refunded");
    return t("failed");
  };

  const closeDialog = () => {
    setPendingAction(null);
    setReason("");
    setExtendDate("");
  };

  const handleStatus = async (status: "active" | "suspended") => {
    setBusy(true);
    try {
      await setPlatformCompanyStatus(companyId, status, reason.trim() || undefined);
      toast.success(status === "active" ? t("reactivated") : t("suspendedSuccess"));
      closeDialog();
      await refresh();
    } catch (err) {
      toastApiError(err, t("actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleExtend = async () => {
    if (!extendDate) {
      toast.error(t("extendDateRequired"));
      return;
    }
    setBusy(true);
    try {
      const iso = new Date(extendDate).toISOString();
      await extendPlatformSubscription(companyId, iso, reason.trim() || undefined);
      toast.success(t("extendSuccess"));
      closeDialog();
      await refresh();
    } catch (err) {
      toastApiError(err, t("actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AdminTableSkeleton rows={4} />;

  if (error) {
    return (
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />
    );
  }

  if (!company) {
    return <AdminEmptyState title={t("companyNotFound")} description={t("companyNotFoundDesc")} />;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToClients")}
      </Link>

      <div className="dashboard-card p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{company.companyName}</h2>
            <p className="text-sm text-muted-foreground">{t("companyProfile")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AccountStatusBadge status={company.accountStatus} />
            {company.subscriptionStatus ? (
              <SubscriptionStatusBadge status={company.subscriptionStatus} />
            ) : null}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("companyIdCol")}</dt>
            <dd className="font-mono text-xs" dir="ltr">
              {company.companyId}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("ownerEmail")}</dt>
            <dd className="font-medium" dir="ltr">
              {company.ownerEmail ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("accountStatusCol")}</dt>
            <dd>
              <AccountStatusBadge status={company.accountStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("statusCol")}</dt>
            <dd>
              {company.subscriptionStatus ? (
                <SubscriptionStatusBadge status={company.subscriptionStatus} />
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("usersCount")}</dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(company.usersCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("documentsCol")}</dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(company.documentsCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("latestActivity")}</dt>
            <dd className="font-medium">
              {company.latestActivityAt
                ? formatDate(company.latestActivityAt, locale)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("subscriptionSourceCol")}</dt>
            <dd className="font-medium">
              {company.subscriptionSource
                ? t(`subscriptionSource_${company.subscriptionSource}`)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("planCode")}</dt>
            <dd className="font-medium">{company.planCode ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("billingCycle")}</dt>
            <dd className="font-medium">{company.billingCycle ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("planAmount")}</dt>
            <dd className="font-medium">
              {company.planAmount != null
                ? formatCurrency(company.planAmount, locale)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("expiryCol")}</dt>
            <dd className="font-medium">
              {company.subscriptionExpiresAt
                ? formatDate(company.subscriptionExpiresAt, locale)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("renewalDate")}</dt>
            <dd className="font-medium">
              {company.nextRenewalAt ? formatDate(company.nextRenewalAt, locale) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("joinedAt")}</dt>
            <dd className="font-medium">{formatDate(company.companyCreatedAt, locale)}</dd>
          </div>
        </dl>

        {company.suspensionReason ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {t("suspensionReason")}: {company.suspensionReason}
          </p>
        ) : null}
      </div>

      {company.subscriptionStatus === "trialing" && trialUsage ? (
        <div className="dashboard-card p-5 space-y-3">
          <p className="text-sm font-semibold">{t("trialUsageTitle")}</p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("trialUsageTotal")}</dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(trialUsage.totalDocuments, locale)} /{" "}
                {formatNumber(trialUsage.trialLimit, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("trialUsageRemaining")}</dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(trialUsage.remainingDocuments, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("trialUsageReceipts")}</dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(trialUsage.receiptsCount, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("trialUsagePayments")}</dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(trialUsage.paymentsCount, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("trialUsageInvoices")}</dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(trialUsage.invoicesCount, locale)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {promoRedemptions && promoRedemptions.length > 0 ? (
        <div className="dashboard-card p-5 space-y-3">
          <p className="text-sm font-semibold">{t("promoRedemptionsTitle")}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-start">
                  <th className="pb-2 pe-3 font-medium">{t("promoCodeCol")}</th>
                  <th className="pb-2 pe-3 font-medium">{t("promoGrantedDaysCol")}</th>
                  <th className="pb-2 pe-3 font-medium">{t("promoStartsCol")}</th>
                  <th className="pb-2 font-medium">{t("promoExpiresCol")}</th>
                </tr>
              </thead>
              <tbody>
                {promoRedemptions.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pe-3 font-mono text-xs" dir="ltr">
                      {row.promoCode ?? "—"}
                    </td>
                    <td className="py-2 pe-3 tabular-nums">
                      {formatNumber(row.grantedDays, locale)}
                    </td>
                    <td className="py-2 pe-3">{formatDate(row.startsAt, locale)}</td>
                    <td className="py-2">{formatDate(row.expiresAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="dashboard-card p-5 space-y-4">
        <p className="text-sm font-semibold">{t("paymentsSummary")}</p>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("paymentsCompletedTotal")}</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(paymentSummary.completedTotal, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("paymentsCompletedCount")}</dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(paymentSummary.completedCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("paymentsPendingCount")}</dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(paymentSummary.pendingCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("paymentsFailedCount")}</dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(paymentSummary.failedCount, locale)}
            </dd>
          </div>
        </dl>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
        ) : (
          <ul className="divide-y divide-border/60 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium tabular-nums">
                  {formatCurrency(p.amount, locale)}
                </span>
                <Badge
                  variant={
                    p.status === "completed"
                      ? "success"
                      : p.status === "pending"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {paymentStatusLabel(p.status)}
                </Badge>
                <span className="text-muted-foreground">{p.gateway}</span>
                <span className="text-xs text-muted-foreground">
                  {p.paidAt
                    ? formatDate(p.paidAt, locale)
                    : p.failedAt
                      ? formatDate(p.failedAt, locale)
                      : formatDate(p.createdAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dashboard-card p-5 space-y-4">
        <p className="text-sm font-semibold">{t("recentActivityLogs")}</p>
        {companyActions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCompanyActivity")}</p>
        ) : (
          <ul className="divide-y divide-border/60 text-sm">
            {companyActions.map((row) => (
              <li key={row.id} className="py-2.5 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{row.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(row.createdAt, locale)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.entityType} · <span dir="ltr">{row.entityId.slice(0, 8)}…</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/actions"
          className="text-xs text-primary hover:underline"
        >
          {t("viewAllActions")}
        </Link>
      </div>

      <div className="dashboard-card p-5 space-y-4">
        <p className="text-sm font-semibold">{t("adminActions")}</p>
        {!canManage && <AdminReadOnlyHint />}

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {company.accountStatus === "suspended" ? (
              <Button disabled={busy} onClick={() => setPendingAction("reactivate")}>
                {t("reactivate")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => setPendingAction("suspend")}
              >
                {t("suspend")}
              </Button>
            )}
            <Button variant="outline" disabled={busy} onClick={() => setPendingAction("extend")}>
              {t("extend")}
            </Button>
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={pendingAction === "suspend"}
        onOpenChange={(open) => !open && closeDialog()}
        title={t("confirmSuspendTitle")}
        description={t("confirmSuspendDesc", { name: company.companyName })}
        confirmLabel={t("confirmSuspend")}
        cancelLabel={t("cancel")}
        variant="destructive"
        busy={busy}
        onConfirm={() => void handleStatus("suspended")}
      >
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">{t("reasonOptional")}</Label>
          <Input
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            disabled={busy}
          />
        </div>
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={pendingAction === "reactivate"}
        onOpenChange={(open) => !open && closeDialog()}
        title={t("confirmReactivateTitle")}
        description={t("confirmReactivateDesc", { name: company.companyName })}
        confirmLabel={t("confirmReactivate")}
        cancelLabel={t("cancel")}
        busy={busy}
        onConfirm={() => void handleStatus("active")}
      >
        <div className="space-y-2">
          <Label htmlFor="reactivate-reason">{t("reasonOptional")}</Label>
          <Input
            id="reactivate-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            disabled={busy}
          />
        </div>
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={pendingAction === "extend"}
        onOpenChange={(open) => !open && closeDialog()}
        title={t("confirmExtendTitle")}
        description={t("confirmExtendDesc", { name: company.companyName })}
        confirmLabel={t("confirmExtend")}
        cancelLabel={t("cancel")}
        busy={busy}
        onConfirm={() => void handleExtend()}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="extend-date">{t("extendExpiry")}</Label>
            <Input
              id="extend-date"
              type="datetime-local"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extend-reason">{t("reasonOptional")}</Label>
            <Input
              id="extend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              disabled={busy}
            />
          </div>
        </div>
      </AdminConfirmDialog>
    </div>
  );
}
