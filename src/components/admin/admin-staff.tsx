"use client";

import { useState } from "react";
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
  addPlatformStaff,
  changePlatformStaffRole,
  removePlatformStaff,
  usePlatformStaff,
} from "@/hooks/use-platform-staff";
import { usePlatformSession } from "@/hooks/use-platform-admin";
import { formatDate } from "@/lib/format";
import type { PlatformStaffModel } from "@/application/platform/types";
import type { PlatformRole } from "@/lib/types";
import type { PlatformApiError } from "@/lib/platform/api-client";

function StaffRoleBadge({
  role,
  label,
}: {
  role: PlatformRole;
  label: string;
}) {
  return (
    <Badge variant={role === "platform_admin" ? "default" : "secondary"} className="font-normal">
      {label}
    </Badge>
  );
}

export function AdminStaffContent() {
  const t = useTranslations("admin.staff");
  const locale = useLocale();
  const { canManage } = usePlatformSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<PlatformRole>("platform_support");
  const [changeTarget, setChangeTarget] = useState<PlatformStaffModel | null>(null);
  const [changeRole, setChangeRole] = useState<PlatformRole>("platform_support");
  const [removeTarget, setRemoveTarget] = useState<PlatformStaffModel | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refresh } = usePlatformStaff({ page, search });

  const roleLabel = (role: PlatformRole) =>
    role === "platform_admin" ? t("roleAdmin") : t("roleSupport");

  const handleAdd = async () => {
    if (!addEmail.trim()) {
      toast.error(t("validationEmail"));
      return;
    }
    setBusy(true);
    try {
      await addPlatformStaff({
        email: addEmail.trim().toLowerCase(),
        platform_role: addRole,
      });
      toast.success(t("added"));
      setAddOpen(false);
      setAddEmail("");
      setAddRole("platform_support");
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("addFailed"));
    } finally {
      setBusy(false);
    }
  };

  const openChange = (item: PlatformStaffModel) => {
    setChangeTarget(item);
    setChangeRole(item.platformRole);
  };

  const handleChangeRole = async () => {
    if (!changeTarget) return;
    setBusy(true);
    try {
      await changePlatformStaffRole(changeTarget.profileId, changeRole);
      toast.success(t("roleChanged"));
      setChangeTarget(null);
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("changeFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setBusy(true);
    try {
      await removePlatformStaff(removeTarget.profileId);
      toast.success(t("removed"));
      setRemoveTarget(null);
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("removeFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <AdminTableSkeleton rows={5} />;

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
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t("addStaff")}
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
                    {t("emailCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("nameCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("roleCol")}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                    {t("createdCol")}
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
                    key={item.profileId}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {item.email}
                    </td>
                    <td className="px-4 py-3">{item.fullName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StaffRoleBadge
                        role={item.platformRole}
                        label={roleLabel(item.platformRole)}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(item.createdAt, locale)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => openChange(item)}
                          >
                            <Pencil className="h-4 w-4 me-1" />
                            {t("changeRole")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={busy}
                            onClick={() => setRemoveTarget(item)}
                          >
                            <Trash2 className="h-4 w-4 me-1" />
                            {t("removeAccess")}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addStaff")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{t("addHint")}</p>
            <div className="space-y-1">
              <Label>{t("emailCol")}</Label>
              <Input
                type="email"
                dir="ltr"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("roleCol")}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as PlatformRole)}
              >
                <option value="platform_admin">{t("roleAdmin")}</option>
                <option value="platform_support">{t("roleSupport")}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void handleAdd()} disabled={busy}>
              {t("addStaff")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={changeTarget !== null} onOpenChange={(open) => !open && setChangeTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("changeRole")}</DialogTitle>
          </DialogHeader>
          {changeTarget && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {t("changeRoleDesc", { email: changeTarget.email })}
              </p>
              <div className="space-y-1">
                <Label>{t("roleCol")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={changeRole}
                  onChange={(e) => setChangeRole(e.target.value as PlatformRole)}
                >
                  <option value="platform_admin">{t("roleAdmin")}</option>
                  <option value="platform_support">{t("roleSupport")}</option>
                </select>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">{t("lastAdminWarning")}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setChangeTarget(null)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void handleChangeRole()} disabled={busy}>
              {t("confirmChange")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={t("removeAccess")}
        description={
          removeTarget
            ? t("removeDesc", { email: removeTarget.email })
            : t("removeDescGeneric")
        }
        confirmLabel={t("confirmRemove")}
        cancelLabel={t("cancel")}
        variant="destructive"
        busy={busy}
        onConfirm={() => void handleRemove()}
      >
        <p className="text-xs text-amber-700 dark:text-amber-400">{t("lastAdminWarning")}</p>
      </AdminConfirmDialog>
    </div>
  );
}
