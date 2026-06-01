import type { TenantContext } from "@/domain";
import type { CompanyMember, TenantRole } from "@/domain";

/**
 * Resolves the active tenant for the current session.
 * Implementation: read cookie/header, validate membership.
 */
export interface TenantContextResolver {
  resolve(userId: string, activeCompanyId?: string): Promise<TenantContext>;
}

/**
 * Ensures the user has at least the required role for an operation.
 */
export interface AuthorizationService {
  requireRole(ctx: TenantContext, minimumRole: TenantRole): void;
  canManageMembers(ctx: TenantContext): boolean;
  canCreateDocuments(ctx: TenantContext): boolean;
}

export interface ListUserCompaniesResult {
  memberships: CompanyMember[];
  activeCompanyId: string | null;
}

export interface TenancyService {
  listCompanies(userId: string): Promise<ListUserCompaniesResult>;
  switchCompany(userId: string, companyId: string): Promise<TenantContext>;
}
