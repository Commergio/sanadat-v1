import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLogPort, DocumentActivityAction } from "@/application/documents";
import type { TenantContext } from "@/domain";
import { toRepositoryError } from "../shared/errors";

export class ActivityLogRepository implements ActivityLogPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async log(
    ctx: TenantContext,
    action: DocumentActivityAction,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const entityType =
      (metadata?.documentType as string | undefined) ??
      (metadata?.entityType as string | undefined) ??
      "document";

    const { error } = await this.supabase.from("activity_logs").insert({
      company_id: ctx.companyId,
      user_id: ctx.userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ?? {},
    });

    if (error) throw toRepositoryError(error, "Failed to write activity log");
  }
}
