import type { TenantContext } from "@/domain";
import { hasMinimumRole } from "@/domain";
import { UseCaseError } from "@/application/shared/use-case-error";

export function assertCanReadCustomers(_ctx: TenantContext): void {
  // viewer and above can list/read customers
}

export function assertCanWriteCustomers(ctx: TenantContext): void {
  if (!hasMinimumRole(ctx.role, "accountant")) {
    throw new UseCaseError(
      "FORBIDDEN",
      "Insufficient role. owner/admin/accountant required."
    );
  }
}
