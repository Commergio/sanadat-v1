import type { SupabaseClient } from "@supabase/supabase-js";
import { PlatformRepository } from "@/infrastructure/supabase/repositories/platform/platform.repository";
import { buildPlatformUseCases } from "./use-cases";

export function buildPlatformApp(supabase: SupabaseClient) {
  const repository = new PlatformRepository(supabase);
  return buildPlatformUseCases({ repository });
}
