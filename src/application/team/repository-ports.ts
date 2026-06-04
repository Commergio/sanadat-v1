import type { TenantContext } from "@/domain";
import type { TenantRole } from "@/lib/tenant";
import type { TeamInvitationModel, TeamMemberModel } from "./types";

export interface TeamRepositoryPort {
  inviteCompanyMember(
    ctx: TenantContext,
    input: { email: string; role: Exclude<TenantRole, "owner"> }
  ): Promise<string>;
  acceptCompanyInvitation(token: string): Promise<string>;
  listCompanyMembers(ctx: TenantContext): Promise<TeamMemberModel[]>;
  listCompanyInvitations(ctx: TenantContext): Promise<TeamInvitationModel[]>;
  changeCompanyMemberRole(
    ctx: TenantContext,
    memberId: string,
    role: Exclude<TenantRole, "owner">
  ): Promise<void>;
  removeCompanyMember(ctx: TenantContext, memberId: string): Promise<void>;
  revokeCompanyInvitation(ctx: TenantContext, invitationId: string): Promise<void>;
}
