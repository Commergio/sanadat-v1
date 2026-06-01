import type { Company, Subscription } from "@/lib/types";

/** Tenant-scoped role within a company */
export type TenantRole = "owner" | "admin" | "accountant" | "viewer";

/** Sanadat platform operator role (not a tenant role) */
export type PlatformRole = "platform_admin" | "platform_support";

/**
 * Resolved tenant context for the current request.
 * Required for all company-scoped operations.
 */
export interface TenantContext {
  userId: string;
  companyId: string;
  role: TenantRole;
  email: string;
  company: Company;
  membershipId: string;
  subscription: Subscription | null;
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: TenantRole;
  companyName: string;
  acceptedAt: string | null;
}

export interface AuthSession {
  userId: string;
  email: string;
  platformRole: PlatformRole | null;
}
