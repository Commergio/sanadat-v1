import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "company-logos";
const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "الصيغ المدعومة: PNG, JPG, WebP, SVG";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "الحد الأقصى لحجم الشعار: 2 ميجابايت";
  }
  return null;
}

function getExtension(file: File): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return map[file.type] ?? "png";
}

export function getLogoPublicUrl(
  supabaseUrl: string,
  userId: string,
  ext: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${userId}/logo.${ext}`;
}

export async function uploadCompanyLogo(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  file: File
): Promise<{ publicUrl: string }> {
  const validationError = validateLogoFile(file);
  if (validationError) throw new Error(validationError);

  const ext = getExtension(file);
  const path = `${userId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("companies")
    .update({ logo_url: urlWithCacheBust })
    .eq("id", companyId)
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return { publicUrl: urlWithCacheBust };
}

export async function removeCompanyLogo(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<void> {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);

  if (files?.length) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("companies")
    .update({ logo_url: null })
    .eq("id", companyId)
    .eq("user_id", userId);

  if (error) throw error;
}
