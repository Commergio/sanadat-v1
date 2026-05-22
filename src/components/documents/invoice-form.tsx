"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";

export function InvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
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

  const onSubmit = async (_data: InvoiceInput) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("تم إنشاء الفاتورة بنجاح");
      router.push("/ar/dashboard/invoices");
    } catch {
      toast.error("فشل إنشاء الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">فاتورة جديدة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" {...register("date")} />
            </div>
            <div className="space-y-2">
              <Label>اسم العميل</Label>
              <Input {...register("party_name")} />
              {errors.party_name && <p className="text-xs text-destructive">{errors.party_name.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">بنود الفاتورة</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
          >
            <Plus className="h-4 w-4" />
            إضافة بند
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
                  <Label className="text-xs">الوصف</Label>
                  <Input {...register(`items.${index}.description`)} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">الكمية</Label>
                  <Input type="number" {...register(`items.${index}.quantity`)} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">سعر الوحدة</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.unit_price`)} />
                </div>
                <div className="sm:col-span-2 text-sm font-semibold py-2">
                  {formatCurrency(lineTotal)}
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
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>الخصم (ر.س)</Label>
            <Input type="number" className="w-32" {...register("discount")} />
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>الإجمالي</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الإنشاء..." : "إنشاء الفاتورة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
