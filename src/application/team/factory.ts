import type { SupabaseClient } from "@supabase/supabase-js";
import { ActivityLogRepository, TeamRepository } from "@/infrastructure/supabase/repositories";
import { buildTeamUseCases } from "./use-cases";

export function buildTeamApp(supabase: SupabaseClient) {
  const repository = new TeamRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);
  return buildTeamUseCases({ repository, activityLog });
}
