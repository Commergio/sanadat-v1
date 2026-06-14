import { z } from "zod";

export const setCompanyStatusInputSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z.string().max(2000).optional(),
});

export const extendSubscriptionInputSchema = z.object({
  new_expires_at: z.string().min(1),
  reason: z.string().max(2000).optional(),
});

export const addPlatformStaffInputSchema = z.object({
  email: z.string().email().max(320),
  platform_role: z.enum(["platform_admin", "platform_support"]),
});

export const changePlatformStaffRoleInputSchema = z.object({
  platform_role: z.enum(["platform_admin", "platform_support"]),
});
