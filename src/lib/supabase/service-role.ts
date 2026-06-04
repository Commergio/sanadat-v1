import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured } from "@/lib/env";

/**
 * Server-only Supabase client with service role (bypasses RLS).
 * Use only after application-layer authorization checks.
 */
export function createServiceRoleClient(): SupabaseClient {
  if (!isServiceRoleConfigured()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
