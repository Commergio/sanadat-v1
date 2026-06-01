import { createClient } from "@/lib/supabase/server";
import {
  getActiveCompanyIdFromCookies,
  getTenantContext,
  type TenantContext,
} from "@/lib/tenant";
import { isSupabaseConfigured } from "@/lib/env";
import { TenantResolutionError } from "@/lib/tenant/errors";

/**
 * Loads tenant context for the current request or throws.
 * Use in protected Server Components and API routes.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  if (!isSupabaseConfigured()) {
    throw new TenantResolutionError(
      "Supabase is not configured",
      "UNAUTHENTICATED"
    );
  }

  const supabase = await createClient();
  const activeCompanyId = await getActiveCompanyIdFromCookies();
  return getTenantContext(supabase, activeCompanyId);
}
