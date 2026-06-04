import { z } from "zod";
import { billingGatewaySchema } from "./schemas";

export const paymentWebhookInputSchema = z
  .object({
    gateway: billingGatewaySchema,
    provider_event_id: z.string().min(1),
    gateway_reference: z.string().min(1),
    status: z.enum(["completed", "failed"]),
    amount: z.number().positive(),
    currency: z.string().min(1),
    paid_at: z.string().min(1).optional(),
    failed_at: z.string().min(1).optional(),
    failure_code: z.string().optional(),
    failure_reason: z.string().optional(),
    raw_payload: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "completed" && !data.paid_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "paid_at is required when status is completed",
        path: ["paid_at"],
      });
    }
    if (data.status === "failed" && !data.failed_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "failed_at is required when status is failed",
        path: ["failed_at"],
      });
    }
  });

export type PaymentWebhookInput = z.infer<typeof paymentWebhookInputSchema>;
