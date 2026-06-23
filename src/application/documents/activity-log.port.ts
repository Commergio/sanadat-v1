import type { TenantContext } from "@/domain";

export type DocumentActivityAction =
  | "document.created"
  | "document.draft_created"
  | "document.approval_sent"
  | "document.approved"
  | "document.rejected"
  | "document.issued"
  | "document.approval_recalled"
  | "document.cancelled"
  | "document.exported"
  | "document.shared"
  | "customer.created"
  | "customer.updated"
  | "customer.verification_sent"
  | "customer.verified"
  | "team.invited"
  | "team.invite_accepted"
  | "team.role_changed"
  | "team.member_removed"
  | "team.invite_revoked"
  | "billing.payment_completed"
  | "billing.payment_failed"
  | "billing.manual_payment_approved"
  | "billing.manual_payment_rejected"
  | "coupon.applied"
  | "promo_code.applied";

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
