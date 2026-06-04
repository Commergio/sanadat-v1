import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import type { Locale } from "@/i18n/routing";
import type { PlatformRole } from "@/lib/tenant/types";

/**
 * Server guard for /[locale]/admin pages.
 * Uses Supabase Auth + profiles.platform_role only — no TenantContext.
 */
export async function requirePlatformPageAccess(
  locale: Locale,
  returnTo: string
): Promise<{ role: PlatformRole }> {
  if (!isSupabaseConfigured()) {
    redirect(
      `/${locale}/login?returnTo=${encodeURIComponent(returnTo)}&error=supabase_not_configured`
    );
  }

  const supabase = await createClient();
  const session = await getAuthSession(supabase);

  if (!session) {
    redirect(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!session.platformRole) {
    redirect(`/${locale}/dashboard`);
  }

  return { role: session.platformRole };
}
