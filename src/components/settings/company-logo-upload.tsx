"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
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
  demoMode?: boolean;
  onUpdated: (logoUrl: string | null) => void;
}

export function CompanyLogoUpload({
  company,
  userId,
  demoMode = false,
  onUpdated,
}: CompanyLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [preview, setPreview] = useState<string | null>(company.logo_url ?? null);

  const handleFile = async (file: File) => {
    const validation = validateLogoFile(file);
    if (validation) {
      toast.error(validation);
      return;
    }

    setUploading(true);

    if (demoMode) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onUpdated(dataUrl);
        toast.success("تم تحديث الشعار (معاينة محلية)");
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("فشل قراءة الملف");
        setUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

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
      toast.success("تم رفع الشعار بنجاح");
    } catch (err) {
      setPreview(company.logo_url ?? null);
      toast.error(
        err instanceof Error ? err.message : "فشل رفع الشعار"
      );
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      if (demoMode) {
        setPreview(null);
        onUpdated(null);
        toast.success("تم حذف الشعار");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      await removeCompanyLogo(supabase, userId, company.id);
      setPreview(null);
      onUpdated(null);
      toast.success("تم حذف الشعار");
    } catch {
      toast.error("فشل حذف الشعار");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>شعار المنشأة</Label>
      <p className="text-xs text-muted-foreground">
        يظهر على سندات القبض والصرف والفواتير — PNG, JPG, WebP, SVG (حد أقصى 2MB)
      </p>

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
                alt="شعار المنشأة"
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
            if (file) handleFile(file);
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
            {preview ? "تغيير الشعار" : "رفع الشعار"}
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
              حذف
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
