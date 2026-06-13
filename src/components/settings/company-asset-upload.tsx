"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Building2, Loader2, PenLine, Stamp, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/env";
import {
  removeCompanyAsset,
  uploadCompanyAsset,
  validateLogoFile,
  type CompanyAssetKind,
} from "@/lib/storage/company-logo";
import { cn } from "@/lib/utils";

interface CompanyAssetUploadProps {
  kind: CompanyAssetKind;
  value?: string | null;
  companyId: string;
  userId: string;
  onChange: (url: string | null) => void;
  className?: string;
}

const kindIcons = {
  logo: Building2,
  signature: PenLine,
  stamp: Stamp,
} as const;

export function CompanyAssetUpload({
  kind,
  value,
  companyId,
  userId,
  onChange,
  className,
}: CompanyAssetUploadProps) {
  const t = useTranslations("settings.company");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  const Icon = kindIcons[kind];
  const labelKey = `${kind}Label` as const;
  const hintKey = `${kind}Hint` as const;

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
      const { publicUrl } = await uploadCompanyAsset(
        supabase,
        userId,
        companyId,
        kind,
        file
      );
      setPreview(publicUrl);
      onChange(publicUrl);
      toast.success(t("assetSuccess", { asset: t(labelKey) }));
    } catch (err) {
      setPreview(value ?? null);
      const msg =
        err instanceof Error && (err.message === "invalidFormat" || err.message === "maxSize")
          ? t(err.message)
          : t("uploadFailed");
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
      await removeCompanyAsset(supabase, userId, companyId, kind);
      setPreview(null);
      onChange(null);
      toast.success(t("assetRemoved", { asset: t(labelKey) }));
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setRemoving(false);
    }
  };

  const previewBoxClass =
    kind === "stamp"
      ? "h-24 w-24 rounded-full"
      : kind === "signature"
        ? "h-20 w-full max-w-[180px] rounded-lg"
        : "h-24 w-24 rounded-xl";

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{t(labelKey)}</Label>
      <p className="text-xs leading-relaxed text-muted-foreground">{t(hintKey)}</p>

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 transition-colors",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {preview ? (
          <div
            className={cn(
              "relative mb-4 overflow-hidden border border-border bg-white shadow-sm",
              previewBoxClass
            )}
          >
            <Image
              src={preview}
              alt={t(labelKey)}
              fill
              className={cn("object-contain", kind === "signature" ? "p-1" : "p-2")}
              unoptimized
            />
          </div>
        ) : (
          <div
            className={cn(
              "mb-4 flex items-center justify-center border border-border bg-background",
              previewBoxClass
            )}
          >
            <Icon className="h-8 w-8 text-muted-foreground/40" />
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
            {uploading ? t("uploading") : preview ? t("changeAsset") : t("uploadAsset")}
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
              {t("removeAsset")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
