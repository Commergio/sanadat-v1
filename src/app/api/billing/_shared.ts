import { UseCaseError } from "@/application/shared/use-case-error";
import { TenantResolutionError } from "@/lib/tenant/errors";

export function mapBillingStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "NOT_IMPLEMENTED") return 501;
  if (code === "ALREADY_PROCESSED") return 409;
  return 500;
}

export function mapBillingRouteError(error: unknown): {
  status: number;
  body: { error: { code: string; message: string; details?: unknown } };
} {
  if (error instanceof UseCaseError) {
    return {
      status: mapBillingStatus(error.code),
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
    const status = error.code === "UNAUTHENTICATED" ? 401 : 404;
    return {
      status,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL",
        message: "Unexpected billing error",
      },
    },
  };
}
