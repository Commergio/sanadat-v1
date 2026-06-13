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

export type LogoValidationKey = "invalidFormat" | "maxSize";
export type CompanyAssetKind = "logo" | "signature" | "stamp";

const ASSET_DB_FIELDS: Record<CompanyAssetKind, "logo_url" | "signature_url" | "stamp_url"> = {
  logo: "logo_url",
  signature: "signature_url",
  stamp: "stamp_url",
};

const ASSET_FILE_BASE: Record<CompanyAssetKind, string> = {
  logo: "logo",
  signature: "signature",
  stamp: "stamp",
};

export function validateLogoFile(file: File): LogoValidationKey | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "invalidFormat";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "maxSize";
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

export async function uploadCompanyAsset(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  kind: CompanyAssetKind,
  file: File
): Promise<{ publicUrl: string }> {
  const validationKey = validateLogoFile(file);
  if (validationKey) throw new Error(validationKey);

  const ext = getExtension(file);
  const fileBase = ASSET_FILE_BASE[kind];
  const path = `${userId}/${fileBase}.${ext}`;

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
  const dbField = ASSET_DB_FIELDS[kind];

  const { error: updateError } = await supabase
    .from("companies")
    .update({ [dbField]: urlWithCacheBust })
    .eq("id", companyId)
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return { publicUrl: urlWithCacheBust };
}

export async function removeCompanyAsset(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  kind: CompanyAssetKind
): Promise<void> {
  const fileBase = ASSET_FILE_BASE[kind];
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);

  if (files?.length) {
    const paths = files
      .filter((f) => f.name.startsWith(`${fileBase}.`))
      .map((f) => `${userId}/${f.name}`);
    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  }

  const dbField = ASSET_DB_FIELDS[kind];
  const { error } = await supabase
    .from("companies")
    .update({ [dbField]: null })
    .eq("id", companyId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function uploadCompanyLogo(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  file: File
): Promise<{ publicUrl: string }> {
  return uploadCompanyAsset(supabase, userId, companyId, "logo", file);
}

export async function removeCompanyLogo(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<void> {
  return removeCompanyAsset(supabase, userId, companyId, "logo");
}
