import { createClient } from "@/lib/supabase/server";
import { getAuthSession, type AuthSession } from "@/lib/tenant";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Returns the current authenticated session or null.
 * Use in Server Components and Route Handlers.
 */
export async function getServerAuthSession(): Promise<AuthSession | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  return getAuthSession(supabase);
}

/**
 * Returns true when the user has a valid Supabase session.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerAuthSession();
  return session !== null;
}
