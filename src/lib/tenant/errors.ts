export class TenantResolutionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "UNAUTHENTICATED"
      | "NO_MEMBERSHIP"
      | "COMPANY_NOT_FOUND"
      | "INVALID_COMPANY"
  ) {
    super(message);
    this.name = "TenantResolutionError";
  }
}
