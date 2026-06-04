import { UseCaseError } from "@/application/shared/use-case-error";
import { PlatformResolutionError } from "@/lib/platform";

export function mapPlatformStatus(code: string): number {
  if (code === "UNAUTHENTICATED") return 401;
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "RPC_ERROR") return 502;
  if (code === "CONFLICT") return 409;
  return 500;
}

export function mapPlatformRouteError(error: unknown): {
  status: number;
  body: { error: { code: string; message: string; details?: unknown } };
} {
  if (error instanceof UseCaseError) {
    return {
      status: mapPlatformStatus(error.code),
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error instanceof PlatformResolutionError) {
    return {
      status: mapPlatformStatus(error.code),
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
        message: "Unexpected platform error",
      },
    },
  };
}
