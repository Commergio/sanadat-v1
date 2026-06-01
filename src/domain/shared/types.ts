/**
 * Tenant context passed to every use case and repository call.
 * Ensures all operations are scoped to an active company.
 */
export interface TenantContext {
  companyId: string;
  userId: string;
  role: import("../identity/types").TenantRole;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export type DomainErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "SUBSCRIPTION_EXPIRED";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}
