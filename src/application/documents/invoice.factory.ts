import { buildInvoiceUseCases } from "@/application/documents";
import {
  ActivityLogRepository,
  DocumentNumberRepository,
  SupabaseInvoiceRepository,
} from "@/infrastructure/supabase/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

export function buildInvoiceApp(supabase: SupabaseClient) {
  const repository = new SupabaseInvoiceRepository(supabase);
  const numberRepository = new DocumentNumberRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildInvoiceUseCases({
    repository,
    numberRepository,
    activityLog,
  });
}
