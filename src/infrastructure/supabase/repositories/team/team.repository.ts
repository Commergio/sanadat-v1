import type { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "@/application/shared/errors";
import type { TeamRepositoryPort } from "@/application/team";
import type { TeamInvitationModel, TeamMemberModel } from "@/application/team";
import type { TenantContext } from "@/domain";

type Row = Record<string, unknown>;

function mapRpcError(error: { code?: string; message?: string }, fallback: string): RepositoryError {
  const code = error.code ?? "";
  const message = (error.message ?? fallback).toLowerCase();

  if (code === "42501" || message.includes("forbidden")) {
    return new RepositoryError("FORBIDDEN", error.message ?? fallback, error);
  }
  if (message.includes("expired")) {
    return new RepositoryError("EXPIRED_INVITATION", error.message ?? fallback, error);
  }
  if (message.includes("email mismatch")) {
    return new RepositoryError("FORBIDDEN", error.message ?? fallback, error);
  }
  if (message.includes("already accepted")) {
    return new RepositoryError("ALREADY_ACCEPTED", error.message ?? fallback, error);
  }
  if (code === "23505" || message.includes("conflict") || message.includes("already")) {
    return new RepositoryError("CONFLICT", error.message ?? fallback, error);
  }
  if (code === "P0001" || message.includes("not found")) {
    return new RepositoryError("NOT_FOUND", error.message ?? fallback, error);
  }
  return new RepositoryError("VALIDATION", error.message ?? fallback, error);
}

function mapMember(row: Row): TeamMemberModel {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    userId: String(row.user_id),
    role: row.role as TeamMemberModel["role"],
    invitedBy: (row.invited_by as string | null) ?? null,
    invitedAt: (row.invited_at as string | null) ?? null,
    acceptedAt: (row.accepted_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: (row.updated_at as string | null) ?? null,
    email: (row.email as string | null) ?? null,
  };
}

function mapInvitation(row: Row): TeamInvitationModel {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    email: String(row.email),
    role: row.role as TeamInvitationModel["role"],
    token: (row.token as string | undefined) ?? undefined,
    invitedBy: String(row.invited_by),
    expiresAt: String(row.expires_at),
    acceptedAt: (row.accepted_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    revokedBy: (row.revoked_by as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export class TeamRepository implements TeamRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  private async assertMemberInCompany(ctx: TenantContext, memberId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("company_members")
      .select("company_id")
      .eq("id", memberId)
      .maybeSingle();
    if (error) throw mapRpcError(error, "Failed to verify member");
    if (!data || String(data.company_id) !== ctx.companyId) {
      throw new RepositoryError("NOT_FOUND", "Member not found");
    }
  }

  private async assertInvitationInCompany(ctx: TenantContext, invitationId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("company_invitations")
      .select("company_id")
      .eq("id", invitationId)
      .maybeSingle();
    if (error) throw mapRpcError(error, "Failed to verify invitation");
    if (!data || String(data.company_id) !== ctx.companyId) {
      throw new RepositoryError("NOT_FOUND", "Invitation not found");
    }
  }

  async inviteCompanyMember(
    ctx: TenantContext,
    input: { email: string; role: "admin" | "accountant" | "viewer" }
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc("invite_company_member", {
      p_company_id: ctx.companyId,
      p_email: input.email.toLowerCase(),
      p_role: input.role,
    });
    if (error) throw mapRpcError(error, "Failed to invite company member");
    return String(data);
  }

  async acceptCompanyInvitation(token: string): Promise<string> {
    const { data, error } = await this.supabase.rpc("accept_company_invitation", {
      p_token: token,
    });
    if (error) throw mapRpcError(error, "Failed to accept invitation");
    if (!data) {
      throw new RepositoryError("NOT_FOUND", "Invitation not found");
    }
    return String(data);
  }

  async listCompanyMembers(ctx: TenantContext): Promise<TeamMemberModel[]> {
    const { data, error } = await this.supabase
      .from("company_members")
      .select("id, company_id, user_id, role, invited_by, invited_at, accepted_at, created_at, updated_at")
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false });
    if (error) throw mapRpcError(error, "Failed to list members");

    const rows = (data ?? []) as Row[];
    const userIds = rows.map((r) => String(r.user_id));
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      for (const p of (profiles ?? []) as Row[]) {
        profileMap.set(String(p.id), String(p.email));
      }
    }

    return rows.map((row) => ({ ...mapMember(row), email: profileMap.get(String(row.user_id)) ?? null }));
  }

  async listCompanyInvitations(ctx: TenantContext): Promise<TeamInvitationModel[]> {
    const { data, error } = await this.supabase
      .from("company_invitations")
      .select("id, company_id, email, role, token, invited_by, expires_at, accepted_at, revoked_at, revoked_by, created_at")
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false });
    if (error) throw mapRpcError(error, "Failed to list invitations");
    return ((data ?? []) as Row[]).map(mapInvitation);
  }

  async changeCompanyMemberRole(
    ctx: TenantContext,
    memberId: string,
    role: "admin" | "accountant" | "viewer"
  ): Promise<void> {
    await this.assertMemberInCompany(ctx, memberId);
    const { error } = await this.supabase.rpc("change_company_member_role", {
      p_member_id: memberId,
      p_new_role: role,
    });
    if (error) throw mapRpcError(error, "Failed to change member role");
  }

  async removeCompanyMember(ctx: TenantContext, memberId: string): Promise<void> {
    await this.assertMemberInCompany(ctx, memberId);
    const { error } = await this.supabase.rpc("remove_company_member", {
      p_member_id: memberId,
    });
    if (error) throw mapRpcError(error, "Failed to remove member");
  }

  async revokeCompanyInvitation(ctx: TenantContext, invitationId: string): Promise<void> {
    await this.assertInvitationInCompany(ctx, invitationId);
    const { error } = await this.supabase.rpc("revoke_company_invitation", {
      p_invitation_id: invitationId,
    });
    if (error) throw mapRpcError(error, "Failed to revoke invitation");
  }
}
