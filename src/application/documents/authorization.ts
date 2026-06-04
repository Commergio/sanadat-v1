import { hasMinimumRole, type TenantRole } from "@/domain";
import type { TenantContext } from "@/domain";
import { UseCaseError } from "@/application/shared/use-case-error";

const WRITE_MIN_ROLE: TenantRole = "accountant";

export function assertCanRead(_ctx: TenantContext): void {
  // viewer and above can read/list
}

export function assertCanCreateOrCancel(ctx: TenantContext): void {
  if (!hasMinimumRole(ctx.role, WRITE_MIN_ROLE)) {
    throw new UseCaseError(
      "FORBIDDEN",
      "Insufficient role. owner/admin/accountant required."
    );
  }
}
