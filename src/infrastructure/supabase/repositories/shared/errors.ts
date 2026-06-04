import type { PostgrestError } from "@supabase/supabase-js";
import { RepositoryError, type RepositoryErrorCode } from "@/application/shared/errors";

const PG_FORBIDDEN = "42501";
const PG_NOT_FOUND = "PGRST116";
const PG_CONFLICT = "23505";

function mapCode(error: PostgrestError): RepositoryErrorCode {
  if (error.code === PG_FORBIDDEN) return "FORBIDDEN";
  if (error.code === PG_NOT_FOUND) return "NOT_FOUND";
  if (error.code === PG_CONFLICT) return "CONFLICT";
  return "VALIDATION";
}

export function toRepositoryError(error: PostgrestError, fallback: string): RepositoryError {
  return new RepositoryError(mapCode(error), error.message || fallback, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
