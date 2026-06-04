import type { TenantRole } from "@/lib/tenant";

export interface TeamMemberModel {
  id: string;
  companyId: string;
  userId: string;
  role: TenantRole;
  invitedBy?: string | null;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  email?: string | null;
}

export interface TeamInvitationModel {
  id: string;
  companyId: string;
  email: string;
  role: TenantRole;
  token?: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
  createdAt: string;
}
