export function mapTeamStatus(code: string): number {
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "VALIDATION") return 400;
  if (code === "CONFLICT") return 409;
  if (code === "EXPIRED_INVITATION") return 410;
  if (code === "ALREADY_ACCEPTED") return 409;
  return 500;
}
