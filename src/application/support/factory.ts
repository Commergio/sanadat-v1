import type { SupabaseClient } from "@supabase/supabase-js";
import { SupportRepository } from "@/infrastructure/supabase/repositories/support/support.repository";
import { buildSupportUseCases } from "./use-cases";

export function buildSupportApp(supabase: SupabaseClient) {
  const repository = new SupportRepository(supabase);
  return buildSupportUseCases({ repository });
}
