import type { TenantContext } from "@/lib/tenant";
import { hasMinimumTenantRole } from "@/lib/tenant";
import { UseCaseError } from "@/application/shared/use-case-error";

export function assertCanReadBilling(_ctx: TenantContext): void {
  // All tenant members (viewer+) may read subscription and payment history.
}

export function assertCanStartCheckout(ctx: TenantContext): void {
  if (!hasMinimumTenantRole(ctx.role, "admin")) {
    throw new UseCaseError(
      "FORBIDDEN",
      "Insufficient role. owner/admin required to start checkout."
    );
  }
}
