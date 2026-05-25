"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDocumentBaseSchema } from "@/lib/validations";
import { usePaymentMethods } from "@/hooks/use-translated-constants";
import type { z } from "zod";

interface VoucherFormProps {
  type: "receipt" | "payment";
  redirectPath: string;
}

export function VoucherForm({ type, redirectPath }: VoucherFormProps) {
  const router = useRouter();
  const t = useTranslations("documents");
  const tv = useTranslations("validation");
  const paymentMethods = usePaymentMethods();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  const schema = useMemo(() => createDocumentBaseSchema(tv), [tv]);
  type VoucherFormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
    },
  });

  const title = type === "receipt" ? t("newReceipt") : t("newPayment");

  const onSubmit = async (_data: VoucherFormData) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(t("createSuccess"));
      router.push(redirectPath);
    } catch {
      toast.error(t("createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("date")}</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("amount")}</Label>
              <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("party")}</Label>
            <Input placeholder={t("partyPlaceholder")} {...register("party_name")} />
            {errors.party_name && <p className="text-xs text-destructive">{errors.party_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("description")}</Label>
            <Input placeholder={t("descriptionPlaceholder")} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>{t("paymentMethod")}</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => {
                setPaymentMethod(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethods).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("payment_method")} value={paymentMethod} />
          </div>

          {paymentMethod === "bank_transfer" && (
            <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>{t("bankName")}</Label>
                <Input {...register("bank_name")} />
              </div>
              <div className="space-y-2">
                <Label>{t("transferNumber")}</Label>
                <Input {...register("transfer_number")} dir="ltr" className="text-left" />
              </div>
            </div>
          )}

          {paymentMethod === "pos" && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <Label>{t("referenceNumber")}</Label>
              <Input {...register("reference_number")} dir="ltr" className="text-left" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? t("creating") : t("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">⚠️ {t("immutableNote")}</p>
    </form>
  );
}
