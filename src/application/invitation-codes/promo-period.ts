import type { SubscriptionModel } from "@/application/billing/types";

export function computePromoAccessPeriod(
  subscription: SubscriptionModel | null,
  durationDays: number,
  now = new Date()
): { startsAt: string; expiresAt: string } {
  const nowMs = now.getTime();

  if (
    subscription &&
    subscription.status === "active" &&
    new Date(subscription.expiresAt).getTime() > nowMs
  ) {
    const periodEnd = new Date(subscription.expiresAt);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + durationDays);
    return {
      startsAt: subscription.startsAt,
      expiresAt: periodEnd.toISOString(),
    };
  }

  const periodStart = now;
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + durationDays);

  return {
    startsAt: periodStart.toISOString(),
    expiresAt: periodEnd.toISOString(),
  };
}
