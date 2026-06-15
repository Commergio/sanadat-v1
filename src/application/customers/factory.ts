import type { SupabaseClient } from "@supabase/supabase-js";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";
import { CustomerRepository } from "@/infrastructure/supabase/repositories/customers/customer.repository";
import { buildCustomerUseCases } from "./use-cases";

export function buildCustomerApp(supabase: SupabaseClient) {
  const repository = new CustomerRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);
  return buildCustomerUseCases({ repository, activityLog });
}
