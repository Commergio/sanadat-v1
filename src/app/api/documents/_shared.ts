export function mapDocumentStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "TRIAL_LIMIT_REACHED") return 403;
  if (code === "SUBSCRIPTION_INACTIVE") return 403;
  return 500;
}
