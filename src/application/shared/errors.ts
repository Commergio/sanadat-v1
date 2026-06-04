export type RepositoryErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "EXPIRED_INVITATION"
  | "ALREADY_ACCEPTED"
  | "ALREADY_PROCESSED"
  | "UNAUTHENTICATED"
  | "RPC_ERROR";

export class RepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string,
    public readonly causeData?: unknown
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}
