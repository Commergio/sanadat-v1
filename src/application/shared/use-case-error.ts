export type UseCaseErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "EXPIRED_INVITATION"
  | "ALREADY_ACCEPTED"
  | "ALREADY_PROCESSED"
  | "NOT_IMPLEMENTED"
  | "UNAUTHENTICATED"
  | "GATEWAY_ERROR"
  | "RPC_ERROR";

export class UseCaseError extends Error {
  constructor(
    public readonly code: UseCaseErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "UseCaseError";
  }
}
