"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { documentBaseSchema } from "@/lib/validations";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { z } from "zod";

type VoucherFormData = z.infer<typeof documentBaseSchema>;

interface VoucherFormProps {
  type: "receipt" | "payment";
  redirectPath: string;
}

export function VoucherForm({ type, redirectPath }: VoucherFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(documentBaseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
    },
  });

  const title = type === "receipt" ? "سند قبض جديد" : "سند صرف جديد";

  const onSubmit = async (_data: VoucherFormData) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(`تم إنشاء ${title} بنجاح — غير قابل للتعديل`);
      router.push(redirectPath);
    } catch {
      toast.error("فشل إنشاء المستند");
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
              <Label>التاريخ</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ر.س)</Label>
              <Input type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>اسم الطرف</Label>
            <Input placeholder="اسم العميل أو المورد" {...register("party_name")} />
            {errors.party_name && <p className="text-xs text-destructive">{errors.party_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>البيان / الوصف</Label>
            <Input placeholder="وصف اختياري للمستند" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>طريقة الدفع</Label>
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
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
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
                <Label>اسم البنك</Label>
                <Input {...register("bank_name")} />
              </div>
              <div className="space-y-2">
                <Label>رقم التحويل</Label>
                <Input {...register("transfer_number")} dir="ltr" className="text-left" />
              </div>
            </div>
          )}

          {paymentMethod === "pos" && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <Label>رقم المرجع</Label>
              <Input {...register("reference_number")} dir="ltr" className="text-left" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الإنشاء..." : "إنشاء المستند"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        ⚠️ المستندات غير قابلة للتعديل بعد الإنشاء. يمكن الإلغاء فقط مع ذكر السبب.
      </p>
    </form>
  );
}
