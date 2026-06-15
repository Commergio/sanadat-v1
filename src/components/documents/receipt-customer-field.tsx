"use client";

import { useCallback, useState } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudioField } from "@/components/documents/studio-field";
import { useCustomers, createCustomer } from "@/hooks/use-customers";
import type { VoucherStudioFormData } from "@/components/documents/voucher-studio/voucher-studio-context";
import { toast } from "sonner";

interface ReceiptCustomerFieldProps {
  control: Control<VoucherStudioFormData>;
  errors: FieldErrors<VoucherStudioFormData>;
  setValue: (name: keyof VoucherStudioFormData, value: string) => void;
  fieldValid: (name: keyof VoucherStudioFormData) => boolean;
}

export function ReceiptCustomerField({
  control,
  errors,
  setValue,
  fieldValid,
}: ReceiptCustomerFieldProps) {
  const t = useTranslations("documents");
  const tc = useTranslations("dashboard.customers");
  const [search, setSearch] = useState("");
  const { customers, loading, refresh } = useCustomers(search);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("يرجى إدخال الاسم والجوال");
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
  }, [newName, newPhone, refresh, setValue, tc]);

  return (
    <div className="space-y-4">
      <StudioField
        label={t("selectCustomer")}
        error={errors.customer_id?.message as string | undefined}
        showValid={fieldValid("customer_id")}
        required
      >
        <Input
          placeholder={t("searchCustomer")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <Controller
          name="customer_id"
          control={control}
          render={({ field }) => (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/80 p-1">
              {loading ? (
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
      </StudioField>

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
            <Button type="button" size="sm" disabled={creating} onClick={() => void handleCreate()}>
              {creating ? t("creating") : tc("addCustomer")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowNew(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
