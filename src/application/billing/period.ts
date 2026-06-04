import type { SubscriptionModel } from "./types";

export function computeYearlyBillingPeriod(subscription: SubscriptionModel | null, now = new Date()) {
  let periodStart = now;

  if (
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    const expires = new Date(subscription.expiresAt);
    if (expires > now) {
      periodStart = expires;
    }
  }

  const periodEnd = new Date(periodStart);
  periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);

  const startsAt = subscription?.startsAt ?? periodStart.toISOString();

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    startsAt,
  };
}
