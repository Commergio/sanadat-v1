import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePlatformStaffRole } from "@/lib/auth/platform-staff";
import type { AuthSession } from "@/lib/tenant/types";

/**
 * Auth session for the signed-in user (Supabase Auth + profiles.platform_role).
 * Does not load tenant/company context.
 */
export async function getAuthSession(
  supabase: SupabaseClient
): Promise<AuthSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const platformRole = await resolvePlatformStaffRole(supabase, user.id);

  return {
    userId: user.id,
    email: user.email,
    platformRole,
  };
}

/** Server convenience: auth session without tenant context. */
export async function getServerAuthSession(): Promise<AuthSession | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return getAuthSession(supabase);
}
