import { z } from "zod";
import { BILLING_PLAN_CODES } from "@/application/billing/constants";
import { normalizeCouponCode } from "./calculate-discount";

const optionalIso = z
  .string()
  .min(1)
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v ?? null));

const couponCodeSchema = z
  .string()
  .min(1)
  .max(50)
  .transform(normalizeCouponCode);

const couponFieldsSchema = z.object({
  code: couponCodeSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.coerce.number().positive(),
  currency: z.string().length(3).default("SAR"),
  max_redemptions: z.coerce.number().int().positive().nullable().optional(),
  per_company_limit: z.coerce.number().int().positive().default(1),
  starts_at: optionalIso,
  expires_at: optionalIso,
  active: z.boolean().default(true),
});

function refineCouponDates(
  data: { starts_at?: string | null; expires_at?: string | null },
  ctx: z.RefinementCtx
) {
  if (data.starts_at && data.expires_at) {
    const start = new Date(data.starts_at).getTime();
    const end = new Date(data.expires_at).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "expires_at must be after starts_at",
        path: ["expires_at"],
      });
    }
  }
}

function refineDiscountValue(
  data: { discount_type: "percentage" | "fixed_amount"; discount_value: number },
  ctx: z.RefinementCtx
) {
  if (data.discount_type === "percentage" && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100",
      path: ["discount_value"],
    });
  }
}

export const createCouponSchema = couponFieldsSchema.superRefine((data, ctx) => {
  refineCouponDates(data, ctx);
  refineDiscountValue(data, ctx);
});

export const updateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    discount_type: z.enum(["percentage", "fixed_amount"]).optional(),
    discount_value: z.coerce.number().positive().optional(),
    currency: z.string().length(3).optional(),
    max_redemptions: z.coerce.number().int().positive().nullable().optional(),
    per_company_limit: z.coerce.number().int().positive().optional(),
    starts_at: optionalIso,
    expires_at: optionalIso,
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    refineCouponDates(data, ctx);
    if (data.discount_type && data.discount_value !== undefined) {
      refineDiscountValue(
        { discount_type: data.discount_type, discount_value: data.discount_value },
        ctx
      );
    } else if (data.discount_type === "percentage" && data.discount_value === undefined) {
      // partial update without discount_value — validated on repository merge if needed
    }
  });

export const validateCouponInputSchema = z.object({
  code: z.string().min(1).max(50),
  plan_code: z.enum(BILLING_PLAN_CODES),
  billing_cycle: z.literal("yearly"),
});
