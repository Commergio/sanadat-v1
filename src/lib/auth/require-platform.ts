import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import {
  PlatformResolutionError,
  type PlatformAccess,
  type PlatformContext,
} from "@/lib/platform";

/**
 * Loads platform staff context for admin API routes.
 * @param access `staff` = admin + support (read); `admin` = platform_admin only (mutations)
 */
export async function requirePlatformContext(
  access: PlatformAccess = "staff"
): Promise<PlatformContext> {
  if (!isSupabaseConfigured()) {
    throw new PlatformResolutionError(
      "Supabase is not configured",
      "UNAUTHENTICATED"
    );
  }

  const supabase = await createClient();
  const session = await getAuthSession(supabase);

  if (!session) {
    throw new PlatformResolutionError("Authentication required", "UNAUTHENTICATED");
  }

  if (!session.platformRole) {
    throw new PlatformResolutionError(
      "Platform staff role required",
      "FORBIDDEN"
    );
  }

  if (access === "admin" && session.platformRole !== "platform_admin") {
    throw new PlatformResolutionError(
      "platform_admin role required for this action",
      "FORBIDDEN"
    );
  }

  return {
    userId: session.userId,
    email: session.email,
    role: session.platformRole,
  };
}
