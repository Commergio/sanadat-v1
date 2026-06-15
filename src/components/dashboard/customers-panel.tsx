"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, UserCircle2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useCustomers, createCustomer, updateCustomer, sendCustomerVerification } from "@/hooks/use-customers";
import { useCompany } from "@/hooks/use-company";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import type { Customer } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { cn, generateWhatsAppLink } from "@/lib/utils";
import { resolveWhatsAppPhone } from "@/lib/phone/whatsapp";
import { useLocale } from "next-intl";

type FormMode = "create" | "edit" | null;

interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  nationalId: string;
}

const emptyForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  nationalId: "",
};

function customerToForm(customer: Customer): CustomerFormState {
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? "",
    nationalId: customer.national_id ?? "",
  };
}

export function CustomersPanel() {
  const t = useTranslations("dashboard.customers");
  const locale = useLocale();
  const { tenantRole, company } = useCompany();
  const canWrite = tenantRole != null && hasMinimumTenantRole(tenantRole, "accountant");
  const [search, setSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { customers, loading, error, refresh } = useCustomers(search);

  const dialogOpen = formMode !== null;

  const openCreate = () => {
    if (!canWrite) return;
    setFormMode("create");
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const openEdit = (customer: Customer) => {
    if (!canWrite) return;
    setFormMode("edit");
    setEditingCustomer(customer);
    setForm(customerToForm(customer));
  };

  const closeDialog = () => {
    setFormMode(null);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (formMode === "create") {
        await createCustomer({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          nationalId: form.nationalId || undefined,
        });
        toast.success(t("createSuccess"));
      } else if (formMode === "edit" && editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          nationalId: form.nationalId || null,
        });
        toast.success(t("updateSuccess"));
      }
      closeDialog();
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const filteredCount = useMemo(() => customers.length, [customers]);

  const handleSendVerification = async (customer: Customer) => {
    if (!canWrite) return;
    setSendingId(customer.id);
    try {
      const { verificationUrl } = await sendCustomerVerification(customer.id, locale);
      const message = t("whatsappVerificationMessage", {
        name: customer.name,
        company: company?.name ?? t("companyFallback"),
        link: verificationUrl,
      });
      window.open(generateWhatsAppLink(resolveWhatsAppPhone(customer.phone), message), "_blank");
      toast.success(t("verificationSent"));
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("verificationSendFailed"));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="h-9 bg-muted/40 pe-10 shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2 shrink-0"
          onClick={openCreate}
          disabled={!canWrite}
        >
          <Plus className="h-4 w-4" />
          {t("addCustomer")}
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredCount === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border/80 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{t("name")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("phone")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("email")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("verification")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 tabular-nums" dir="ltr">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={customer.is_verified ? "default" : "outline"}>
                        {customer.is_verified ? t("verifiedBadge") : t("unverified")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={sendingId === customer.id}
                            onClick={() => void handleSendVerification(customer)}
                            title={t("sendVerificationLink")}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="sr-only">{t("sendVerificationLink")}</span>
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{t("view")}</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(customer)}
                          disabled={!canWrite}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t("edit")}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{customer.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground tabular-nums" dir="ltr">
                      {customer.phone}
                    </p>
                    {customer.email ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={customer.is_verified ? "default" : "outline"}>
                    {customer.is_verified ? t("verifiedBadge") : t("unverified")}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canWrite ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 min-w-[140px]"
                      disabled={sendingId === customer.id}
                      onClick={() => void handleSendVerification(customer)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t("sendVerificationLink")}
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                    <Link href={`/dashboard/customers/${customer.id}`}>
                      <Eye className="h-4 w-4" />
                      {t("view")}
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => openEdit(customer)}
                    disabled={!canWrite}
                  >
                    <Pencil className="h-4 w-4" />
                    {t("edit")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen && canWrite} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? t("addCustomer") : t("editCustomer")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">{t("name")}</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">{t("phone")}</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="text-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">{t("emailOptional")}</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("emailPlaceholder")}
                dir="ltr"
                className="text-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-national-id">{t("nationalIdOptional")}</Label>
              <Input
                id="customer-national-id"
                value={form.nationalId}
                onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                placeholder={t("nationalIdPlaceholder")}
                dir="ltr"
                className="text-start"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving || !form.name.trim() || !form.phone.trim()}
            >
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CustomerProfileCard({
  customer,
  onEdit,
  onSendVerification,
  sendingVerification,
  className,
}: {
  customer: Customer;
  onEdit?: () => void;
  onSendVerification?: () => void;
  sendingVerification?: boolean;
  className?: string;
}) {
  const t = useTranslations("dashboard.customers");
  const locale = useLocale();

  return (
    <div className={cn("rounded-xl border border-border/80 bg-card p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{customer.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums" dir="ltr">
              {customer.phone}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={customer.is_verified ? "default" : "outline"}>
                {customer.is_verified ? t("verifiedBadge") : t("unverified")}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {onSendVerification ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={sendingVerification}
              onClick={onSendVerification}
            >
              <MessageCircle className="h-4 w-4" />
              {t("sendVerificationLink")}
            </Button>
          ) : null}
          {onEdit ? (
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              {t("edit")}
            </Button>
          ) : null}
        </div>
      </div>

      {customer.signature_preview_url ? (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("signaturePreview")}
          </p>
          <div className="inline-block rounded-lg border border-border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={customer.signature_preview_url}
              alt={t("signaturePreview")}
              className="max-h-24 max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("email")}
          </dt>
          <dd className="mt-1 text-sm">{customer.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("nationalId")}
          </dt>
          <dd className="mt-1 text-sm tabular-nums" dir="ltr">
            {customer.national_id || "—"}
          </dd>
        </div>
        {customer.verified_at ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("verifiedAt")}
            </dt>
            <dd className="mt-1 text-sm">{formatDate(customer.verified_at, locale)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
