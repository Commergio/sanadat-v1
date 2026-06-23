"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminReadOnlyHint } from "@/components/admin/admin-read-only-hint";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPlatformInvitationCode,
  deletePlatformInvitationCode,
  updatePlatformInvitationCode,
  usePlatformInvitationCodes,
  type InvitationCodeFormInput,
  type InvitationStatusFilter,
} from "@/hooks/use-invitation-codes";
import { usePlatformSession } from "@/hooks/use-platform-admin";
import { formatDate, formatNumber } from "@/lib/format";
import type { InvitationPromoCodeModel } from "@/application/invitation-codes/types";
import type { PlatformApiError } from "@/lib/platform/api-client";

const emptyForm: InvitationCodeFormInput = {
  code: "",
  name: "",
  description: null,
  duration_days: 90,
  max_redemptions: null,
  per_company_limit: 1,
  starts_at: null,
  expires_at: null,
  active: true,
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

function modelToForm(item: InvitationPromoCodeModel): InvitationCodeFormInput {
  return {
    code: item.code,
    name: item.name,
    description: item.description,
    duration_days: item.durationDays,
    max_redemptions: item.maxRedemptions,
    per_company_limit: item.perCompanyLimit,
    starts_at: item.startsAt,
    expires_at: item.expiresAt,
    active: item.active,
  };
}

function isCodeExpired(item: InvitationPromoCodeModel): boolean {
  if (!item.expiresAt) return false;
  const expires = new Date(item.expiresAt).getTime();
  return !Number.isNaN(expires) && expires < Date.now();
}

function remainingRedemptions(item: InvitationPromoCodeModel): string | number {
  if (item.maxRedemptions == null) return "∞";
  const used = item.redemptionCount ?? 0;
  return Math.max(0, item.maxRedemptions - used);
}

function validateForm(form: InvitationCodeFormInput, t: (key: string) => string): string | null {
  if (!form.code.trim()) return t("validationCode");
  if (!form.name.trim()) return t("validationName");
  if (form.duration_days < 1) return t("validationDuration");
  if (form.per_company_limit < 1) return t("validationPerCompany");
  if (form.starts_at && form.expires_at) {
    const start = new Date(form.starts_at).getTime();
    const end = new Date(form.expires_at).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      return t("validationDates");
    }
  }
  return null;
}

const filterOptions: InvitationStatusFilter[] = ["all", "active", "inactive", "expired"];

export function AdminInvitationCodesContent() {
  const t = useTranslations("admin.invitationCodes");
  const locale = useLocale();
  const { canManage } = usePlatformSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvitationStatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvitationPromoCodeModel | null>(null);
  const [form, setForm] = useState<InvitationCodeFormInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, loading, error, refresh } = usePlatformInvitationCodes({
    page,
    search,
    statusFilter,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (item: InvitationPromoCodeModel) => {
    setEditing(item);
    setForm(modelToForm(item));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const buildPayload = (): InvitationCodeFormInput => ({
    ...form,
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description?.trim() ? form.description.trim() : null,
    starts_at: fromDatetimeLocal(toDatetimeLocal(form.starts_at)),
    expires_at: fromDatetimeLocal(toDatetimeLocal(form.expires_at)),
    max_redemptions: form.max_redemptions ?? null,
  });

  const handleSave = async () => {
    const validationError = validateForm(form, t);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updatePlatformInvitationCode(editing.id, payload);
        toast.success(t("updated"));
      } else {
        await createPlatformInvitationCode(payload);
        toast.success(t("created"));
      }
      closeForm();
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (item: InvitationPromoCodeModel) => {
    if (!canManage) return;
    setBusy(true);
    try {
      await updatePlatformInvitationCode(item.id, { active: !item.active });
      toast.success(item.active ? t("disabled") : t("enabled"));
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setBusy(true);
    try {
      await deletePlatformInvitationCode(deleteId);
      toast.success(t("deleted"));
      setDeleteId(null);
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  const filterLabel = useMemo(
    () => ({
      all: t("filterAll"),
      active: t("filterActive"),
      inactive: t("filterInactive"),
      expired: t("filterExpired"),
    }),
    [t]
  );

  if (loading && !data) return <AdminTableSkeleton rows={6} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminErrorBanner
        error={error}
        onRetry={() => void refresh()}
        retryLabel={t("retry")}
      />

      {!canManage && <AdminReadOnlyHint />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          className="flex flex-1 flex-wrap gap-2 min-w-[200px]"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="max-w-xs"
          />
          <Button type="submit" variant="secondary">
            {t("search")}
          </Button>
        </form>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 me-2" />
            {t("create")}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((key) => (
          <Button
            key={key}
            size="sm"
            variant={statusFilter === key ? "default" : "outline"}
            onClick={() => {
              setStatusFilter(key);
              setPage(1);
            }}
          >
            {filterLabel[key]}
          </Button>
        ))}
      </div>

      {items.length === 0 && !loading ? (
        <AdminEmptyState title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("codeCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("nameCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("durationCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("activeCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("startsCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("expiresCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("usageCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("remainingCol")}
                  </th>
                  {canManage && (
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                      {t("actionsCol")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{item.code}</td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatNumber(item.durationDays, locale)} {t("daysUnit")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          !item.active
                            ? "secondary"
                            : isCodeExpired(item)
                              ? "destructive"
                              : "success"
                        }
                        className="font-normal"
                      >
                        {!item.active
                          ? t("statusInactive")
                          : isCodeExpired(item)
                            ? t("statusExpired")
                            : t("statusActive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.startsAt ? formatDate(item.startsAt, locale) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.expiresAt ? formatDate(item.expiresAt, locale) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {item.redemptionCount ?? 0}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {remainingRedemptions(item) === "∞"
                        ? t("unlimited")
                        : formatNumber(remainingRedemptions(item) as number, locale)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void handleToggleActive(item)}
                          >
                            {item.active ? t("disable") : t("enable")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={busy}
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && statusFilter !== "expired" && (
            <div className="border-t border-border/80 px-4 py-3">
              <AdminPagination
                page={data.page}
                limit={data.limit}
                total={data.total}
                onPageChange={setPage}
                labels={{
                  prev: t("pagePrev"),
                  next: t("pageNext"),
                  page: t("pageLabel"),
                }}
              />
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {formError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
                {formError}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("fieldCode")}</Label>
                <Input
                  dir="ltr"
                  className="font-mono uppercase"
                  value={form.code}
                  disabled={!!editing}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldName")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("fieldDescription")}</Label>
              <Input
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value.trim() ? e.target.value : null,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("fieldDurationDays")}</Label>
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      duration_days: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldPerCompanyLimit")}</Label>
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  value={form.per_company_limit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      per_company_limit: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("fieldMaxRedemptions")}</Label>
              <Input
                type="number"
                min={1}
                dir="ltr"
                placeholder={t("unlimited")}
                value={form.max_redemptions ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_redemptions: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("fieldStartsAt")}</Label>
                <Input
                  type="datetime-local"
                  dir="ltr"
                  value={toDatetimeLocal(form.starts_at)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      starts_at: fromDatetimeLocal(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldExpiresAt")}</Label>
                <Input
                  type="datetime-local"
                  dir="ltr"
                  value={toDatetimeLocal(form.expires_at)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expires_at: fromDatetimeLocal(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              {t("fieldActive")}
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeForm} disabled={busy}>
                {t("cancel")}
              </Button>
              <Button onClick={() => void handleSave()} disabled={busy}>
                {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteTitle")}
        description={t("deleteDesc")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        variant="destructive"
        busy={busy}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
