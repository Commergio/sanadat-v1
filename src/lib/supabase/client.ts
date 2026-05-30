import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!isSupabaseConfigured() || !url || !key) {
    throw new Error("Supabase is not configured");
  }

  return createBrowserClient(url, key);
}
