"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/env";
import {
  removeCompanyLogo,
  uploadCompanyLogo,
  validateLogoFile,
} from "@/lib/storage/company-logo";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompanyLogoUploadProps {
  company: Company;
  userId: string;
  onUpdated: (logoUrl: string | null) => void;
}

export function CompanyLogoUpload({
  company,
  userId,
  onUpdated,
}: CompanyLogoUploadProps) {
  const t = useTranslations("settings");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [preview, setPreview] = useState<string | null>(company.logo_url ?? null);

  const handleFile = async (file: File) => {
    const validation = validateLogoFile(file);
    if (validation) {
      toast.error(t(validation));
      return;
    }

    if (!isSupabaseConfigured()) {
      toast.error(t("uploadUnavailable"));
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const supabase = getSupabaseBrowserClient();
      const { publicUrl } = await uploadCompanyLogo(
        supabase,
        userId,
        company.id,
        file
      );
      setPreview(publicUrl);
      onUpdated(publicUrl);
      toast.success(t("logoSuccess"));
    } catch (err) {
      setPreview(company.logo_url ?? null);
      const msg =
        err instanceof Error && (err.message === "invalidFormat" || err.message === "maxSize")
          ? t(err.message)
          : t("logoFailed");
      toast.error(msg);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemove = async () => {
    if (!isSupabaseConfigured()) {
      toast.error(t("uploadUnavailable"));
      return;
    }

    setRemoving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await removeCompanyLogo(supabase, userId, company.id);
      setPreview(null);
      onUpdated(null);
      toast.success(t("logoRemoved"));
    } catch {
      toast.error(t("logoFailed"));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{t("logo")}</Label>
      <p className="text-xs text-muted-foreground">{t("logoHint")}</p>

      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors",
          uploading && "opacity-70 pointer-events-none"
        )}
      >
        {preview ? (
          <div className="relative mb-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <Image
                src={preview}
                alt={t("logo")}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-xl border border-border bg-background">
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? t("uploading") : preview ? t("changeLogo") : t("uploadLogo")}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={uploading || removing}
              onClick={() => void handleRemove()}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t("removeLogo")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
