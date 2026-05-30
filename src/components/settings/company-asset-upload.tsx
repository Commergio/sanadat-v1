"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Building2, Loader2, PenLine, Stamp, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateLogoFile } from "@/lib/storage/company-logo";
import { cn } from "@/lib/utils";

export type CompanyAssetKind = "logo" | "signature" | "stamp";

interface CompanyAssetUploadProps {
  kind: CompanyAssetKind;
  value?: string | null;
  demoMode?: boolean;
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
  demoMode = true,
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

    setUploading(true);

    if (demoMode) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onChange(dataUrl);
        toast.success(t("assetDemoSuccess", { asset: t(labelKey) }));
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error(t("readFileFailed"));
        setUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    toast.error(t("demoOnlyUpload"));
    setUploading(false);
  };

  const handleRemove = () => {
    setRemoving(true);
    setPreview(null);
    onChange(null);
    toast.success(t("assetRemoved", { asset: t(labelKey) }));
    setRemoving(false);
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
              onClick={handleRemove}
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
