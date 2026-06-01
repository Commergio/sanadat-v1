export type {
  TenantContext,
  TenantRole,
  PlatformRole,
  CompanyMembership,
  AuthSession,
} from "./types";

export {
  TENANT_ROLE_RANK,
  hasMinimumTenantRole,
  canManageMembers,
  canCreateDocuments,
  canUpdateCompany,
} from "./roles";

export {
  ACTIVE_COMPANY_COOKIE,
  ACTIVE_COMPANY_COOKIE_MAX_AGE,
} from "./constants";

export { TenantResolutionError } from "./errors";

export {
  getAuthSession,
  listUserMemberships,
  resolveTenantContext,
  getTenantContext,
} from "./tenant-context-service";

export { getActiveCompanyIdFromCookies, activeCompanyCookieOptions } from "./tenant-cookie";
