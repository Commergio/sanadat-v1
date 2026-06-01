export type PlatformRole = "platform_admin" | "platform_support";

export type TenantRole = "owner" | "admin" | "accountant" | "viewer";

/** Role hierarchy rank for permission checks */
export const TENANT_ROLE_RANK: Record<TenantRole, number> = {
  viewer: 1,
  accountant: 2,
  admin: 3,
  owner: 4,
};

export function hasMinimumRole(
  userRole: TenantRole,
  required: TenantRole
): boolean {
  return TENANT_ROLE_RANK[userRole] >= TENANT_ROLE_RANK[required];
}

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  platformRole: PlatformRole | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: TenantRole;
  invitedBy: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  role: TenantRole;
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface IdentityRepository {
  getProfile(userId: string): Promise<Profile | null>;
  getMembership(
    userId: string,
    companyId: string
  ): Promise<CompanyMember | null>;
  listMemberships(userId: string): Promise<CompanyMember[]>;
}
