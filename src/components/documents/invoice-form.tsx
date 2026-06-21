"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoiceSchema, type InvoiceInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/format";
import { useCustomers, createCustomer } from "@/hooks/use-customers";

export function InvoiceForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("documents");
  const tc = useTranslations("dashboard.customers");
  const tv = useTranslations("validation");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const { customers, loading: customersLoading, refresh } = useCustomers(search);

  const schema = useMemo(() => createInvoiceSchema(tv), [tv]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      discount: 0,
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const discount = watch("discount") || 0;

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const total = Math.max(0, subtotal - Number(discount));

  const handleCreateCustomer = useCallback(async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error(tv("partyRequired"));
      return;
    }
    setCreating(true);
    try {
      const customer = await createCustomer({ name: newName.trim(), phone: newPhone.trim() });
      setValue("customer_id", customer.id);
      setValue("party_name", customer.name);
      setShowNew(false);
      setNewName("");
      setNewPhone("");
      await refresh();
      toast.success(tc("createSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("saveFailed"));
    } finally {
      setCreating(false);
    }
  }, [newName, newPhone, refresh, setValue, tc, tv]);

  const onSubmit = async (data: InvoiceInput) => {
    setLoading(true);
    try {
      const payload = {
        date: data.date,
        partyName: data.party_name,
        customerId: data.customer_id,
        description: data.description,
        paymentMethod: data.payment_method,
        transferNumber: data.transfer_number,
        bankName: data.bank_name,
        referenceNumber: data.reference_number,
        discount: Number(data.discount || 0),
        items: data.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
        })),
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        const code = result?.error?.code as string | undefined;
        const message = code === "VALIDATION"
          ? "Validation error: invoice must include valid items and totals."
          : code === "FORBIDDEN"
            ? "You do not have permission to create invoices."
            : code === "NOT_FOUND"
              ? "Tenant context not found. Please refresh and try again."
              : result?.error?.message || "Supabase/RLS error while creating invoice.";
        toast.error(message);
        return;
      }

      toast.success(t("invoiceCreateSuccess"));
      router.push(result.redirectPath ?? "/dashboard/invoices");
    } catch {
      toast.error(t("createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        {t("invoiceApprovalNote")}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("newInvoice")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("date")}</Label>
              <Input type="date" {...register("date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("selectCustomer")}</Label>
            <Input
              placeholder={t("searchCustomer")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/80 p-1">
                  {customersLoading ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">{t("loadingCustomers")}</p>
                  ) : customers.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">{t("noCustomers")}</p>
                  ) : (
                    customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-muted ${
                          field.value === customer.id ? "bg-primary/10 font-medium" : ""
                        }`}
                        onClick={() => {
                          field.onChange(customer.id);
                          setValue("party_name", customer.name);
                        }}
                      >
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1">{customer.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                          {customer.phone}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            />
            {errors.customer_id && (
              <p className="text-xs text-destructive">{errors.customer_id.message}</p>
            )}
          </div>

          {!showNew ? (
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />
              {t("addCustomer")}
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-4">
              <p className="text-xs font-semibold">{t("newCustomerInline")}</p>
              <Input placeholder={tc("namePlaceholder")} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input
                placeholder={tc("phone")}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                dir="ltr"
                className="text-start"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={creating} onClick={() => void handleCreateCustomer()}>
                  {creating ? t("creating") : tc("addCustomer")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNew(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}

          <input type="hidden" {...register("party_name")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t("invoiceItems")}</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
          >
            <Plus className="h-4 w-4" />
            {t("addItem")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => {
            const lineTotal =
              (Number(items[index]?.quantity) || 0) *
              (Number(items[index]?.unit_price) || 0);
            return (
              <div key={field.id} className="grid gap-3 sm:grid-cols-12 items-end p-3 rounded-lg border border-border">
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-xs">{t("itemDescription")}</Label>
                  <Input {...register(`items.${index}.description`)} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">{t("quantity")}</Label>
                  <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">{t("unitPrice")}</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                </div>
                <div className="sm:col-span-2 text-sm font-semibold py-2">
                  {formatCurrency(lineTotal, locale)}
                </div>
                <div className="sm:col-span-1">
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span>{formatCurrency(subtotal, locale)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>{t("discount")}</Label>
            <Input type="number" className="w-32" {...register("discount", { valueAsNumber: true })} />
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>{t("total")}</span>
            <span className="text-primary">{formatCurrency(total, locale)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? t("creatingInvoice") : t("createInvoice")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
