import type { TenantContext } from "@/domain";
import type { ActivityLogPort } from "@/application/documents";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { assertCanManageTeam } from "./authorization";
import {
  acceptInvitationSchema,
  changeMemberRoleSchema,
  inviteCompanyMemberInputSchema,
  removeMemberSchema,
  revokeInvitationSchema,
} from "./schemas";
import type { TeamRepositoryPort } from "./repository-ports";

interface TeamUseCaseDeps {
  repository: TeamRepositoryPort;
  activityLog: ActivityLogPort;
}

function rethrowTeamError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

export function buildTeamUseCases(deps: TeamUseCaseDeps) {
  return {
    async inviteCompanyMember(
      ctx: TenantContext,
      input: { email: string; role: "admin" | "accountant" | "viewer" }
    ): Promise<{ invitationId: string }> {
      assertCanManageTeam(ctx);
      const parsed = inviteCompanyMemberInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invitation input", parsed.error.flatten());
      }

      try {
        const invitationId = await deps.repository.inviteCompanyMember(ctx, parsed.data);
        try {
          await deps.activityLog.log(ctx, "team.invited", invitationId, {
            entityType: "company_invitation",
            role: parsed.data.role,
            email: parsed.data.email.toLowerCase(),
          });
        } catch {
          // Non-blocking
        }
        return { invitationId };
      } catch (error) {
        rethrowTeamError(error, "Failed to invite company member");
      }
    },

    async acceptCompanyInvitation(
      actor: { userId: string },
      token: string
    ): Promise<{ companyId: string }> {
      const parsed = acceptInvitationSchema.safeParse({ token });
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invitation token", parsed.error.flatten());
      }
      try {
        const companyId = await deps.repository.acceptCompanyInvitation(parsed.data.token);
        try {
          await deps.activityLog.log(
            { userId: actor.userId, companyId, role: "viewer" },
            "team.invite_accepted",
            companyId,
            { entityType: "company" }
          );
        } catch {
          // Non-blocking
        }
        return { companyId };
      } catch (error) {
        rethrowTeamError(error, "Failed to accept invitation");
      }
    },

    async listCompanyMembers(ctx: TenantContext) {
      try {
        return await deps.repository.listCompanyMembers(ctx);
      } catch (error) {
        rethrowTeamError(error, "Failed to list company members");
      }
    },

    async listCompanyInvitations(ctx: TenantContext) {
      assertCanManageTeam(ctx);
      try {
        return await deps.repository.listCompanyInvitations(ctx);
      } catch (error) {
        rethrowTeamError(error, "Failed to list company invitations");
      }
    },

    async changeCompanyMemberRole(
      ctx: TenantContext,
      memberId: string,
      role: "admin" | "accountant" | "viewer"
    ): Promise<void> {
      assertCanManageTeam(ctx);
      const parsed = changeMemberRoleSchema.safeParse({ memberId, role });
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid member role input", parsed.error.flatten());
      }
      try {
        await deps.repository.changeCompanyMemberRole(ctx, parsed.data.memberId, parsed.data.role);
        try {
          await deps.activityLog.log(ctx, "team.role_changed", parsed.data.memberId, {
            entityType: "company_member",
            role: parsed.data.role,
          });
        } catch {
          // Non-blocking
        }
      } catch (error) {
        rethrowTeamError(error, "Failed to change member role");
      }
    },

    async removeCompanyMember(ctx: TenantContext, memberId: string): Promise<void> {
      assertCanManageTeam(ctx);
      const parsed = removeMemberSchema.safeParse({ memberId });
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid member id", parsed.error.flatten());
      }
      try {
        await deps.repository.removeCompanyMember(ctx, parsed.data.memberId);
        try {
          await deps.activityLog.log(ctx, "team.member_removed", parsed.data.memberId, {
            entityType: "company_member",
          });
        } catch {
          // Non-blocking
        }
      } catch (error) {
        rethrowTeamError(error, "Failed to remove member");
      }
    },

    async revokeCompanyInvitation(ctx: TenantContext, invitationId: string): Promise<void> {
      assertCanManageTeam(ctx);
      const parsed = revokeInvitationSchema.safeParse({ invitationId });
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid invitation id", parsed.error.flatten());
      }
      try {
        await deps.repository.revokeCompanyInvitation(ctx, parsed.data.invitationId);
        try {
          await deps.activityLog.log(ctx, "team.invite_revoked", parsed.data.invitationId, {
            entityType: "company_invitation",
          });
        } catch {
          // Non-blocking
        }
      } catch (error) {
        rethrowTeamError(error, "Failed to revoke invitation");
      }
    },
  };
}
