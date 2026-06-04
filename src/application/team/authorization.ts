import type { TenantContext } from "@/domain";
import { hasMinimumRole } from "@/domain";
import { UseCaseError } from "@/application/shared/use-case-error";

export function assertCanManageTeam(ctx: TenantContext): void {
  if (!hasMinimumRole(ctx.role, "admin")) {
    throw new UseCaseError("FORBIDDEN", "Insufficient role. owner/admin required.");
  }
}
