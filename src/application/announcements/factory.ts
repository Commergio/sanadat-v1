import type { SupabaseClient } from "@supabase/supabase-js";
import { AnnouncementRepository } from "@/infrastructure/supabase/repositories/announcements/announcement.repository";
import { buildAnnouncementUseCases } from "./use-cases";

export function buildAnnouncementApp(supabase: SupabaseClient) {
  const repository = new AnnouncementRepository(supabase);
  return buildAnnouncementUseCases({ repository });
}
