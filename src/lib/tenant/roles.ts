import type { TenantRole } from "./types";

export const TENANT_ROLE_RANK: Record<TenantRole, number> = {
  viewer: 1,
  accountant: 2,
  admin: 3,
  owner: 4,
};

export function hasMinimumTenantRole(
  userRole: TenantRole,
  required: TenantRole
): boolean {
  return TENANT_ROLE_RANK[userRole] >= TENANT_ROLE_RANK[required];
}

export function canManageMembers(role: TenantRole): boolean {
  return hasMinimumTenantRole(role, "admin");
}

export function canCreateDocuments(role: TenantRole): boolean {
  return hasMinimumTenantRole(role, "accountant");
}

export function canUpdateCompany(role: TenantRole): boolean {
  return hasMinimumTenantRole(role, "admin");
}
