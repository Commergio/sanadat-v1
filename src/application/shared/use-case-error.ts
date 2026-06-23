export type UseCaseErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "EXPIRED_INVITATION"
  | "EXPIRED"
  | "ALREADY_ACCEPTED"
  | "ALREADY_PROCESSED"
  | "NOT_IMPLEMENTED"
  | "UNAUTHENTICATED"
  | "GATEWAY_ERROR"
  | "RPC_ERROR"
  | "TRIAL_LIMIT_REACHED"
  | "SUBSCRIPTION_INACTIVE";

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
