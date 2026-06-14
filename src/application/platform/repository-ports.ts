import type { PlatformListQuery } from "./query";
import type {
  CompanySubscriptionCurrentModel,
  ExtendSubscriptionResult,
  PlatformAdminActionModel,
  PlatformDashboardStatsModel,
  PlatformListResult,
  PlatformPaymentModel,
  PlatformStaffModel,
  SetCompanyStatusResult,
} from "./types";
import type { PlatformRole } from "@/lib/types";
import type { CompanyAccountStatus } from "./types";

export interface PlatformRepositoryPort {
  getDashboardStats(): Promise<PlatformDashboardStatsModel>;
  listCompanies(query: PlatformListQuery): Promise<PlatformListResult<CompanySubscriptionCurrentModel>>;
  getCompanyById(companyId: string): Promise<CompanySubscriptionCurrentModel | null>;
  setCompanyStatus(
    companyId: string,
    status: CompanyAccountStatus,
    reason?: string
  ): Promise<SetCompanyStatusResult>;
  listSubscriptions(
    query: PlatformListQuery
  ): Promise<PlatformListResult<CompanySubscriptionCurrentModel>>;
  extendSubscription(
    companyId: string,
    newExpiresAt: string,
    reason?: string
  ): Promise<ExtendSubscriptionResult>;
  listPayments(query: PlatformListQuery): Promise<PlatformListResult<PlatformPaymentModel>>;
  listAdminActions(
    query: PlatformListQuery
  ): Promise<PlatformListResult<PlatformAdminActionModel>>;
  listStaff(query: PlatformListQuery): Promise<PlatformListResult<PlatformStaffModel>>;
  addStaff(email: string, role: PlatformRole): Promise<PlatformStaffModel>;
  changeStaffRole(profileId: string, role: PlatformRole): Promise<PlatformStaffModel>;
  removeStaff(profileId: string): Promise<{ ok: boolean; profileId: string }>;
}
