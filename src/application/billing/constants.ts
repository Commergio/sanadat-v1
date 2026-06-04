import { SUBSCRIPTION_CURRENCY, SUBSCRIPTION_PRICE } from "@/lib/constants";

export const BILLING_PLAN_CODES = ["sanadat_annual"] as const;

export type BillingPlanCode = (typeof BILLING_PLAN_CODES)[number];

export const BILLING_PLANS: Record<
  BillingPlanCode,
  { amount: number; currency: string; billingCycle: "yearly" }
> = {
  sanadat_annual: {
    amount: SUBSCRIPTION_PRICE,
    currency: SUBSCRIPTION_CURRENCY,
    billingCycle: "yearly",
  },
};

export function resolvePlanPrice(planCode: string): {
  amount: number;
  currency: string;
  billingCycle: "yearly";
} | null {
  if (!(planCode in BILLING_PLANS)) return null;
  return BILLING_PLANS[planCode as BillingPlanCode];
}
