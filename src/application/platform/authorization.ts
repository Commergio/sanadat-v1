import type { PlatformContext } from "@/lib/platform";
import { UseCaseError } from "@/application/shared/use-case-error";

export function assertPlatformStaff(_ctx: PlatformContext): void {
  // requirePlatformContext('staff') already enforced at route boundary.
}

export function assertPlatformAdmin(ctx: PlatformContext): void {
  if (ctx.role !== "platform_admin") {
    throw new UseCaseError(
      "FORBIDDEN",
      "platform_admin role required for this action"
    );
  }
}
