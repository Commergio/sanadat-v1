import { z } from "zod";
import { BILLING_PLAN_CODES } from "./constants";

export const billingGatewaySchema = z.enum(["moyasar", "hyperpay", "stcpay", "manual"]);

export const startCheckoutInputSchema = z.object({
  plan_code: z.enum(BILLING_PLAN_CODES),
  billing_cycle: z.literal("yearly"),
  gateway: billingGatewaySchema,
  coupon_code: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(50).optional()
  ),
});

export type StartCheckoutInput = z.infer<typeof startCheckoutInputSchema>;
