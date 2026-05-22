"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { companySchema, type CompanyInput } from "@/lib/validations";
import { mockCompany } from "@/lib/mock-data";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: mockCompany.name,
      cr_number: mockCompany.cr_number,
      address: mockCompany.address,
      city: mockCompany.city,
      phone: mockCompany.phone,
      email: mockCompany.email,
    },
  });

  const onSubmit = async (_data: CompanyInput) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("تم حفظ بيانات المنشأة");
    setLoading(false);
  };

  return (
    <>
      <DashboardHeader title="الإعدادات" />
      <main className="flex-1 p-4 lg:p-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اكتمال الملف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">نسبة الاكتمال</span>
              <span className="text-sm font-semibold">{mockCompany.profile_completed}%</span>
            </div>
            <Progress value={mockCompany.profile_completed} />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">بيانات المنشأة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المنشأة</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>رقم السجل التجاري</Label>
                  <Input {...register("cr_number")} dir="ltr" className="text-left" />
                </div>
                <div className="space-y-2">
                  <Label>الرقم الضريبي</Label>
                  <Input {...register("vat_number")} dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input {...register("address")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>الجوال</Label>
                  <Input {...register("phone")} dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" {...register("email")} dir="ltr" className="text-left" />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </>
  );
}
