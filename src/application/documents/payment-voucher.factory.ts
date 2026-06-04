import { buildPaymentVoucherUseCases } from "@/application/documents";
import {
  ActivityLogRepository,
  DocumentNumberRepository,
  SupabasePaymentVoucherRepository,
} from "@/infrastructure/supabase/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

export function buildPaymentVoucherApp(supabase: SupabaseClient) {
  const repository = new SupabasePaymentVoucherRepository(supabase);
  const numberRepository = new DocumentNumberRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildPaymentVoucherUseCases({
    repository,
    numberRepository,
    activityLog,
  });
}
