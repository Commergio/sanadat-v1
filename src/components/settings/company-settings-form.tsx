"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Building2,
  FileBadge2,
  MapPin,
  Palette,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyAssetUpload } from "@/components/settings/company-asset-upload";
import { calcCompanyProfileCompletion } from "@/lib/company-local-storage";
import { IS_DEMO_MODE } from "@/lib/constants";
import { PrototypeBadge } from "@/components/shared/prototype-badge";
import { createCompanySettingsSchema, type CompanySettingsInput } from "@/lib/validations";
import { useCompany } from "@/hooks/use-company";
import { cn } from "@/lib/utils";

function SettingsSection({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border/80 px-5 py-4 sm:px-6">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function FieldGroup({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function CompanySettingsForm() {
  const t = useTranslations("settings.company");
  const tv = useTranslations("validation");
  const { company, loading, updateCompanyInStore } = useCompany();
  const [saving, setSaving] = useState(false);

  const schema = useMemo(() => createCompanySettingsSchema(tv), [tv]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanySettingsInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        cr_number: company.cr_number ?? "",
        vat_number: company.vat_number ?? "",
        license_number: company.license_number ?? "",
        address: company.address ?? "",
        phone: company.phone ?? "",
        responsible_person: company.responsible_person ?? "",
      });
    }
  }, [company, reset]);

  const profileCompleted = company
    ? calcCompanyProfileCompletion(company)
    : 0;

  const onSubmit = async (data: CompanySettingsInput) => {
    if (!company) return;

    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const completed = calcCompanyProfileCompletion({
        ...company,
        ...data,
      });

      updateCompanyInStore({
        ...data,
        vat_number: data.vat_number || undefined,
        profile_completed: completed,
      });

      toast.success(IS_DEMO_MODE ? t("saveDemo") : t("saveSuccess"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const updateAsset = (field: "logo_url" | "signature_url" | "stamp_url", url: string | null) => {
    if (!company) return;
    const completed = calcCompanyProfileCompletion({
      ...company,
      [field]: url,
    });
    updateCompanyInStore({
      [field]: url ?? undefined,
      profile_completed: completed,
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!company) {
    return <p className="text-sm text-muted-foreground">{t("notFound")}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6" noValidate>
      <div className="dashboard-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              {t("badge")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="w-full sm:w-48">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("completion")}</span>
              <span className="font-semibold tabular-nums">{profileCompleted}%</span>
            </div>
            <Progress value={profileCompleted} />
          </div>
        </div>
      </div>

      <SettingsSection
        title={t("sectionLegal")}
        description={t("sectionLegalDesc")}
        icon={FileBadge2}
        iconClassName="bg-blue-500/10 text-blue-600"
      >
        <FieldGroup label={t("companyName")} error={errors.name?.message} required>
          <Input {...register("name")} placeholder={t("companyNamePlaceholder")} />
        </FieldGroup>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldGroup label={t("crNumber")} error={errors.cr_number?.message} required>
            <Input
              {...register("cr_number")}
              dir="ltr"
              className="text-start font-mono tabular-nums"
              placeholder="1010123456"
            />
          </FieldGroup>
          <FieldGroup label={t("vatNumber")} error={errors.vat_number?.message}>
            <Input
              {...register("vat_number")}
              dir="ltr"
              className="text-start font-mono tabular-nums"
              placeholder={t("vatOptional")}
            />
          </FieldGroup>
        </div>

        <FieldGroup label={t("licenseNumber")} error={errors.license_number?.message} required>
          <Input
            {...register("license_number")}
            dir="ltr"
            className="text-start font-mono"
            placeholder="LIC-2024-0000"
          />
        </FieldGroup>
      </SettingsSection>

      <SettingsSection
        title={t("sectionContact")}
        description={t("sectionContactDesc")}
        icon={MapPin}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      >
        <FieldGroup label={t("address")} error={errors.address?.message} required>
          <Input {...register("address")} placeholder={t("addressPlaceholder")} />
        </FieldGroup>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldGroup label={t("phone")} error={errors.phone?.message} required>
            <Input
              {...register("phone")}
              dir="ltr"
              className="text-start font-mono tabular-nums"
              placeholder="0512345678"
            />
          </FieldGroup>
          <FieldGroup
            label={t("responsiblePerson")}
            error={errors.responsible_person?.message}
            required
          >
            <Input
              {...register("responsible_person")}
              placeholder={t("responsiblePlaceholder")}
            />
          </FieldGroup>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("sectionBranding")}
        description={t("sectionBrandingDesc")}
        icon={Palette}
        iconClassName="bg-violet-500/10 text-violet-600"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <CompanyAssetUpload
            kind="logo"
            value={company.logo_url}
            demoMode={IS_DEMO_MODE}
            onChange={(url) => updateAsset("logo_url", url)}
          />
          <CompanyAssetUpload
            kind="signature"
            value={company.signature_url}
            demoMode={IS_DEMO_MODE}
            onChange={(url) => updateAsset("signature_url", url)}
          />
          <CompanyAssetUpload
            kind="stamp"
            value={company.stamp_url}
            demoMode={IS_DEMO_MODE}
            onChange={(url) => updateAsset("stamp_url", url)}
          />
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">{t("brandingNote")}</p>
        </div>
      </SettingsSection>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("saveHint")}</p>
          <Button type="submit" className="gap-2 sm:min-w-[160px]" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
        {isDirty ? (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">{t("unsavedChanges")}</p>
        ) : null}
        {IS_DEMO_MODE && (
          <div className="mt-3 flex justify-center sm:justify-start">
            <PrototypeBadge />
          </div>
        )}
      </div>
    </form>
  );
}
