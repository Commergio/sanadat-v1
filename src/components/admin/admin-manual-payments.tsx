"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  approveManualPayment,
  fetchManualPaymentDetail,
  rejectManualPayment,
  useManualPayments,
  type ManualPaymentDetail,
  type ManualPaymentStatus,
} from "@/hooks/use-manual-payments";
import { usePlatformSession } from "@/hooks/use-platform-admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";

type StatusFilter = "all" | ManualPaymentStatus;

export function AdminManualPaymentsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { canManage } = usePlatformSession();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ManualPaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [approveNote, setApproveNote] = useState("");

  const status = filter === "all" ? undefined : filter;
  const { data, loading, error, refresh } = useManualPayments({ status, page, limit: 20 });

  const statusLabel = (value: ManualPaymentStatus) => {
    if (value === "pending") return t("manualPaymentsPending");
    if (value === "approved") return t("manualPaymentsApproved");
    return t("manualPaymentsRejected");
  };

  const statusVariant = (value: ManualPaymentStatus) => {
    if (value === "pending") return "warning" as const;
    if (value === "approved") return "success" as const;
    return "destructive" as const;
  };

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setRejectNote("");
    setApproveNote("");
    setDetailLoading(true);
    try {
      const row = await fetchManualPaymentDetail(id);
      setDetail(row);
    } catch {
      toast.error(t("manualPaymentsLoadFailed"));
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    setRejectNote("");
    setApproveNote("");
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await approveManualPayment(selectedId, approveNote.trim() || undefined);
      toast.success(t("manualPaymentsApproveSuccess"));
      closeDetail();
      await refresh();
    } catch (err) {
      toast.error((err as Error).message || t("manualPaymentsApproveFailed"));
    } finally {
      setActionLoading(false);
    }
  }, [approveNote, closeDetail, refresh, selectedId, t]);

  const handleReject = useCallback(async () => {
    if (!selectedId) return;
    if (rejectNote.trim().length < 3) {
      toast.error(t("manualPaymentsRejectNoteRequired"));
      return;
    }
    setActionLoading(true);
    try {
      await rejectManualPayment(selectedId, rejectNote.trim());
      toast.success(t("manualPaymentsRejectSuccess"));
      closeDetail();
      await refresh();
    } catch (err) {
      toast.error((err as Error).message || t("manualPaymentsRejectFailed"));
    } finally {
      setActionLoading(false);
    }
  }, [closeDetail, refresh, rejectNote, selectedId, t]);

  if (loading && !data) return <AdminTableSkeleton rows={5} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((key) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(key);
              setPage(1);
            }}
          >
            {key === "all" ? t("filterAll") : statusLabel(key)}
          </Button>
        ))}
      </div>

      {items.length === 0 && !loading ? (
        <AdminEmptyState
          title={t("manualPaymentsEmpty")}
          description={t("manualPaymentsEmptyDesc")}
        />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("clientCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("amountCol")}
                  </th>
                  <th className="px-3 py-3 text-start font-medium text-muted-foreground sm:px-4">
                    {t("statusCol")}
                  </th>
                  <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                    {t("dateCol")}
                  </th>
                  <th className="px-3 py-3 text-end font-medium text-muted-foreground sm:px-4">
                    {t("actionsCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="max-w-[160px] px-3 py-3 font-medium sm:px-4">
                      {row.companyName ? (
                        <Link
                          href={`/admin/clients/${row.companyId}`}
                          className="truncate hover:text-primary hover:underline"
                        >
                          {row.companyName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{row.companyId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums sm:px-4">
                      {formatCurrency(row.amount, locale)} {row.currency}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatDate(row.createdAt, locale)}
                    </td>
                    <td className="px-3 py-3 text-end sm:px-4">
                      <Button variant="outline" size="sm" onClick={() => void openDetail(row.id)}>
                        {t("manualPaymentsReview")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && (
        <div className="border-t border-border/80 px-4 py-3">
          <AdminPagination
            page={data.page}
            limit={data.limit ?? 20}
            total={data.total}
            onPageChange={setPage}
            labels={{ prev: t("pagePrev"), next: t("pageNext"), page: t("pageLabel") }}
          />
        </div>
      )}

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
            {detailLoading || !detail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{t("manualPaymentsReviewTitle")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {detail.companyName ?? detail.companyId}
                    </p>
                  </div>
                  <Badge variant={statusVariant(detail.status)}>{statusLabel(detail.status)}</Badge>
                </div>

                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t("amountCol")}</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatCurrency(detail.amount, locale)} {detail.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t("dateCol")}</dt>
                    <dd>{formatDate(detail.createdAt, locale)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t("manualPaymentsPlan")}</dt>
                    <dd>{detail.planCode}</dd>
                  </div>
                </dl>

                {detail.proofUrl ? (
                  <a
                    href={detail.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("manualPaymentsViewProof")}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("manualPaymentsProofUnavailable")}</p>
                )}

                {detail.status === "rejected" && detail.adminNote && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">{t("manualPaymentsRejectReason")}</p>
                    <p className="mt-1 text-muted-foreground">{detail.adminNote}</p>
                  </div>
                )}

                {detail.status === "pending" && canManage && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="space-y-1">
                      <label htmlFor="approve-note" className="text-sm font-medium">
                        {t("manualPaymentsApproveNote")}
                      </label>
                      <textarea
                        id="approve-note"
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={approveNote}
                        disabled={actionLoading}
                        onChange={(e) => setApproveNote(e.target.value)}
                        placeholder={t("manualPaymentsApproveNotePlaceholder")}
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => void handleApprove()}
                    >
                      {actionLoading ? (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("manualPaymentsApprove")}
                    </Button>

                    <div className="space-y-1">
                      <label htmlFor="reject-note" className="text-sm font-medium">
                        {t("manualPaymentsRejectNote")}
                      </label>
                      <textarea
                        id="reject-note"
                        rows={3}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={rejectNote}
                        disabled={actionLoading}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder={t("manualPaymentsRejectNotePlaceholder")}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => void handleReject()}
                    >
                      {t("manualPaymentsReject")}
                    </Button>
                  </div>
                )}

                {detail.status === "pending" && !canManage && (
                  <p className="text-sm text-muted-foreground">{t("manualPaymentsSupportReadOnly")}</p>
                )}

                <Button variant="outline" className="w-full" onClick={closeDetail}>
                  {t("manualPaymentsClose")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
