import { UseCaseError } from "@/application/shared/use-case-error";
import { TenantResolutionError } from "@/lib/tenant/errors";

export function mapAnnouncementRouteError(error: unknown): {
  status: number;
  body: { error: { code: string; message: string; details?: unknown } };
} {
  if (error instanceof UseCaseError) {
    const status =
      error.code === "UNAUTHENTICATED"
        ? 401
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "VALIDATION"
              ? 400
              : 500;
    return {
      status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error instanceof TenantResolutionError) {
    const status =
      error.code === "UNAUTHENTICATED"
        ? 401
        : error.code === "NO_MEMBERSHIP"
          ? 403
          : 404;
    return {
      status,
      body: { error: { code: error.code, message: error.message } },
    };
  }

  return {
    status: 500,
    body: { error: { code: "INTERNAL", message: "Unexpected error" } },
  };
}
