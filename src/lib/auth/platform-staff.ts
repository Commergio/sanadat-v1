import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformRole } from "@/lib/tenant/types";

const PLATFORM_ROLES: PlatformRole[] = ["platform_admin", "platform_support"];

function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === "string" && PLATFORM_ROLES.includes(value as PlatformRole);
}

/**
 * Whether the user is platform staff (admin or support).
 * Prefers `is_platform_staff()` RPC (SECURITY DEFINER), then profile.platform_role.
 */
export async function hasPlatformStaffAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return (await resolvePlatformStaffRole(supabase, userId)) !== null;
}

/**
 * Resolves platform_role for the signed-in user from the database (not JWT claims).
 */
export async function resolvePlatformStaffRole(
  supabase: SupabaseClient,
  userId: string
): Promise<PlatformRole | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile && isPlatformRole(profile.platform_role)) {
    return profile.platform_role;
  }

  // Legacy MVP: profiles.role = 'admin' (user_role) before platform_role was set
  if (profile?.role === "admin") {
    return "platform_admin";
  }

  const { data: isStaff, error: rpcError } = await supabase.rpc("is_platform_staff");
  if (!rpcError && isStaff === true) {
    if (profile && isPlatformRole(profile.platform_role)) {
      return profile.platform_role;
    }
    return "platform_admin";
  }

  return null;
}
