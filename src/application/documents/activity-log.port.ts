import type { TenantContext } from "@/domain";

export type DocumentActivityAction =
  | "document.created"
  | "document.cancelled"
  | "document.exported"
  | "document.shared"
  | "team.invited"
  | "team.invite_accepted"
  | "team.role_changed"
  | "team.member_removed"
  | "team.invite_revoked"
  | "billing.payment_completed"
  | "billing.payment_failed";

export interface ActivityLogPort {
  log(
    ctx: TenantContext,
    action: DocumentActivityAction,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class NoopActivityLogPort implements ActivityLogPort {
  async log(): Promise<void> {
    // intentionally no-op until activity log implementation is wired
  }
}
