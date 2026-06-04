import { z } from "zod";

export const teamRoleSchema = z.enum(["admin", "accountant", "viewer"]);

export const inviteCompanyMemberInputSchema = z.object({
  email: z.string().email(),
  role: teamRoleSchema,
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(16),
});

export const changeMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: teamRoleSchema,
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid(),
});

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});
