"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/header";
import { CompanyLogoUpload } from "@/components/settings/company-logo-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createCompanySchema, type CompanyInput } from "@/lib/validations";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { useCompany } from "@/hooks/use-company";
import { IS_DEMO_MODE } from "@/lib/constants";

function calcProfileCompletion(data: {
  name?: string;
  cr_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string | null;
}): number {
  const fields = [
    data.name,
    data.cr_number,
    data.address,
    data.phone,
    data.email,
    data.logo_url,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tv = useTranslations("validation");
  const { company, loading, refresh, updateCompanyInStore } = useCompany();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const companySchema = useMemo(() => createCompanySchema(tv), [tv]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        name_en: company.name_en ?? "",
        cr_number: company.cr_number ?? "",
        vat_number: company.vat_number ?? "",
        address: company.address ?? "",
        city: company.city ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
      });
    }
  }, [company, reset]);

  useEffect(() => {
    async function loadUser() {
      if (IS_DEMO_MODE) {
        setUserId("demo-user");
        return;
      }
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
      } catch {
        setUserId(null);
      }
    }
    loadUser();
  }, []);

  const profileCompleted = company
    ? calcProfileCompletion(company)
    : 0;

  const onSubmit = async (data: CompanyInput) => {
    if (!company) return;

    setSaving(true);
    try {
      if (IS_DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 600));
        updateCompanyInStore({
          ...data,
          profile_completed: calcProfileCompletion({
            ...data,
            logo_url: company.logo_url,
          }),
        });
        toast.success(t("saveDemo"));
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const completed = calcProfileCompletion({
        ...data,
        logo_url: company.logo_url,
      });

      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          name_en: data.name_en || null,
          cr_number: data.cr_number || null,
          vat_number: data.vat_number || null,
          address: data.address || null,
          city: data.city || null,
          phone: data.phone || null,
          email: data.email || null,
          profile_completed: completed,
        })
        .eq("id", company.id);

      if (error) throw error;

      updateCompanyInStore({
        ...data,
        profile_completed: completed,
      });
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardHeader title={t("title")} />
        <main className="flex-1 p-4 lg:p-8 max-w-2xl space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </>
    );
  }

  if (!company || !userId) {
    return (
      <>
        <DashboardHeader title={t("title")} />
        <main className="flex-1 p-4 lg:p-8">
          <p className="text-muted-foreground text-sm">{t("notFound")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader title={t("title")} />
      <main className="flex-1 p-4 lg:p-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profileCompletion")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("completion")}</span>
              <span className="text-sm font-semibold">{profileCompleted}%</span>
            </div>
            <Progress value={profileCompleted} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("branding")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyLogoUpload
              company={company}
              userId={userId}
              demoMode={IS_DEMO_MODE}
              onUpdated={(logoUrl) => {
                const completed = calcProfileCompletion({
                  ...company,
                  logo_url: logoUrl,
                });
                updateCompanyInStore({
                  logo_url: logoUrl ?? undefined,
                  profile_completed: completed,
                });
                if (!IS_DEMO_MODE) {
                  getSupabaseBrowserClient()
                    .from("companies")
                    .update({
                      logo_url: logoUrl,
                      profile_completed: completed,
                    })
                    .eq("id", company.id)
                    .then(() => refresh());
                }
              }}
            />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("companyData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("companyName")}</Label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("crNumber")}</Label>
                  <Input {...register("cr_number")} dir="ltr" className="text-left" />
                </div>
                <div className="space-y-2">
                  <Label>{t("vatNumber")}</Label>
                  <Input {...register("vat_number")} dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("address")}</Label>
                <Input {...register("address")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("city")}</Label>
                  <Input {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("mobile")}</Label>
                  <Input {...register("phone")} dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input type="email" {...register("email")} dir="ltr" className="text-left" />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? t("saving") : t("save")}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </>
  );
}
