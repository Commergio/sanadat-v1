import type { useTranslations } from "next-intl";

type Translate = ReturnType<typeof useTranslations>;

export function mapDocumentCreateError(
  code: string | undefined,
  t: Translate,
  fallback?: string
): string {
  if (code === "TRIAL_LIMIT_REACHED") return t("trialLimitReached");
  if (code === "SUBSCRIPTION_INACTIVE") return t("subscriptionInactiveCreate");
  if (code === "SUBSCRIPTION_EXPIRED") return t("subscriptionExpiredCreate");
  if (code === "FORBIDDEN") return t("createForbidden");
  if (code === "VALIDATION") return t("createValidationFailed");
  if (code === "NOT_FOUND") return t("createTenantNotFound");
  if (code === "CONFLICT") return t("createConflict");
  return fallback ?? t("createFailed");
}

export function shouldRedirectToSubscription(code: string | undefined): boolean {
  return (
    code === "TRIAL_LIMIT_REACHED" ||
    code === "SUBSCRIPTION_INACTIVE" ||
    code === "SUBSCRIPTION_EXPIRED"
  );
}
