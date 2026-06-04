"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import {
  AnnouncementPriorityBadge,
  AnnouncementStatusBadge,
} from "@/components/admin/admin-announcement-badges";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminReadOnlyHint } from "@/components/admin/admin-read-only-hint";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
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
  createPlatformAnnouncement,
  deletePlatformAnnouncement,
  updatePlatformAnnouncement,
  usePlatformAnnouncements,
  type AnnouncementFormInput,
} from "@/hooks/use-announcements";
import { usePlatformSession } from "@/hooks/use-platform-admin";
import { formatDate } from "@/lib/format";
import type { AnnouncementModel } from "@/application/announcements/types";
import type { PlatformApiError } from "@/lib/platform/api-client";

const emptyForm: AnnouncementFormInput = {
  title_ar: "",
  title_en: "",
  content_ar: "",
  content_en: "",
  priority: "info",
  published: false,
  start_at: null,
  end_at: null,
  target_type: "all",
  company_ids: [],
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

function modelToForm(item: AnnouncementModel): AnnouncementFormInput {
  return {
    title_ar: item.titleAr,
    title_en: item.titleEn,
    content_ar: item.contentAr,
    content_en: item.contentEn,
    priority: item.priority,
    published: item.published,
    start_at: item.startAt,
    end_at: item.endAt,
    target_type: item.targetType,
    company_ids: item.companyIds,
  };
}

export function AdminAnnouncementsContent() {
  const t = useTranslations("admin.announcements");
  const locale = useLocale();
  const { canManage } = usePlatformSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementModel | null>(null);
  const [form, setForm] = useState<AnnouncementFormInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, loading, error, refresh } = usePlatformAnnouncements({ page, search });

  const companyIdsText = useMemo(
    () => (form.company_ids ?? []).join("\n"),
    [form.company_ids]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: AnnouncementModel) => {
    setEditing(item);
    setForm(modelToForm(item));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const buildPayload = (): AnnouncementFormInput => ({
    ...form,
    start_at: fromDatetimeLocal(toDatetimeLocal(form.start_at)),
    end_at: fromDatetimeLocal(toDatetimeLocal(form.end_at)),
    company_ids:
      form.target_type === "specific"
        ? companyIdsText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
  });

  const handleSave = async () => {
    setBusy(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updatePlatformAnnouncement(editing.id, payload);
        toast.success(t("updated"));
      } else {
        await createPlatformAnnouncement(payload);
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

  const handleTogglePublish = async (item: AnnouncementModel) => {
    if (!canManage) return;
    setBusy(true);
    try {
      await updatePlatformAnnouncement(item.id, { published: !item.published });
      toast.success(item.published ? t("unpublished") : t("published"));
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
      await deletePlatformAnnouncement(deleteId);
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

  const titleForRow = (item: AnnouncementModel) =>
    locale === "ar" ? item.titleAr : item.titleEn;

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

      {items.length === 0 && !loading ? (
        <AdminEmptyState title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("titleCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("priorityCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("statusCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("targetCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("scheduleCol")}
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
                    <td className="px-4 py-3 font-medium">{titleForRow(item)}</td>
                    <td className="px-4 py-3">
                      <AnnouncementPriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <AnnouncementStatusBadge
                        published={item.published}
                        isActive={item.isActive}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.targetType === "all"
                        ? t("targetAll")
                        : t("targetSpecific", { count: item.companyIds.length })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.startAt ? formatDate(item.startAt, locale) : "—"}
                      {" → "}
                      {item.endAt ? formatDate(item.endAt, locale) : "—"}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void handleTogglePublish(item)}
                          >
                            {item.published ? t("unpublish") : t("publish")}
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
          {data && (
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("titleAr")}</Label>
                <Input
                  value={form.title_ar}
                  onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("titleEn")}</Label>
                <Input
                  value={form.title_en}
                  onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("contentAr")}</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.content_ar}
                onChange={(e) => setForm((f) => ({ ...f, content_ar: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("contentEn")}</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.content_en}
                onChange={(e) => setForm((f) => ({ ...f, content_en: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("priorityCol")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: e.target.value as AnnouncementFormInput["priority"],
                    }))
                  }
                >
                  <option value="info">{t("priority_info")}</option>
                  <option value="warning">{t("priority_warning")}</option>
                  <option value="success">{t("priority_success")}</option>
                  <option value="critical">{t("priority_critical")}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("targetCol")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.target_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_type: e.target.value as AnnouncementFormInput["target_type"],
                    }))
                  }
                >
                  <option value="all">{t("targetAll")}</option>
                  <option value="specific">{t("targetSpecificOption")}</option>
                </select>
              </div>
            </div>
            {form.target_type === "specific" && (
              <div className="space-y-1">
                <Label>{t("companyIds")}</Label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                  dir="ltr"
                  value={companyIdsText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      company_ids: e.target.value
                        .split(/[\n,]+/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder={t("companyIdsPlaceholder")}
                />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("startAt")}</Label>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocal(form.start_at)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      start_at: fromDatetimeLocal(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("endAt")}</Label>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocal(form.end_at)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      end_at: fromDatetimeLocal(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, published: e.target.checked }))
                }
              />
              <span>{t("publishedLabel")}</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeForm} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void handleSave()} disabled={busy}>
              {editing ? t("save") : t("create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={deleteId !== null}
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
