import { z } from "zod";

export const createInvitationCodeSchema = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(120),
  description: z.string().max(500).nullable().optional(),
  duration_days: z.number().int().min(1).max(3650),
  max_redemptions: z.number().int().min(1).nullable().optional(),
  per_company_limit: z.number().int().min(1).default(1),
  starts_at: z.string().datetime().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

export const updateInvitationCodeSchema = createInvitationCodeSchema.partial();

export const applyInvitationCodeSchema = z.object({
  code: z.string().min(2).max(64),
});
