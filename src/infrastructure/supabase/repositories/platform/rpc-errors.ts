import type { PostgrestError } from "@supabase/supabase-js";
import { RepositoryError, type RepositoryErrorCode } from "@/application/shared/errors";

function mapRpcMessage(message: string): RepositoryErrorCode {
  const upper = message.toUpperCase();
  if (upper.includes("UNAUTHENTICATED")) return "UNAUTHENTICATED";
  if (upper.includes("FORBIDDEN")) return "FORBIDDEN";
  if (upper.includes("NOT_FOUND")) return "NOT_FOUND";
  if (upper.includes("VALIDATION")) return "VALIDATION";
  if (upper.includes("CONFLICT")) return "CONFLICT";
  return "RPC_ERROR";
}

export function toRpcRepositoryError(
  error: PostgrestError,
  fallback: string
): RepositoryError {
  const message = error.message || fallback;
  return new RepositoryError(mapRpcMessage(message), message, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
