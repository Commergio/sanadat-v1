import { buildReceiptVoucherUseCases } from "@/application/documents";
import {
  ActivityLogRepository,
  DocumentNumberRepository,
  SupabaseReceiptRepository,
} from "@/infrastructure/supabase/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

export function buildReceiptVoucherApp(supabase: SupabaseClient) {
  const repository = new SupabaseReceiptRepository(supabase);
  const numberRepository = new DocumentNumberRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildReceiptVoucherUseCases({
    repository,
    numberRepository,
    activityLog,
  });
}
