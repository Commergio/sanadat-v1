import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformListQuery } from "@/application/platform/query";
import type { PlatformRepositoryPort } from "@/application/platform/repository-ports";
import type {
  CompanySubscriptionCurrentModel,
  CompanyAccountStatus,
  ExtendSubscriptionResult,
  PlatformAdminActionModel,
  PlatformDashboardStatsModel,
  PlatformListResult,
  PlatformPaymentModel,
  PlatformStaffModel,
  SetCompanyStatusResult,
} from "@/application/platform/types";
import { RepositoryError } from "@/application/shared/errors";
import { toRepositoryError } from "../shared/errors";
import { toRpcRepositoryError } from "./rpc-errors";
import type { PaymentGateway, PaymentStatus, PlatformRole, SubscriptionStatus } from "@/lib/types";

type CompanyRow = Record<string, unknown>;
type PaymentRow = Record<string, unknown>;
type ActionRow = Record<string, unknown>;
type StaffRow = Record<string, unknown>;

function mapStaffRow(row: StaffRow): PlatformStaffModel {
  return {
    profileId: String(row.id),
    email: String(row.email),
    fullName: (row.full_name as string | null) ?? null,
    platformRole: row.platform_role as PlatformRole,
    createdAt: String(row.created_at),
  };
}

function mapStaffFromRpc(payload: Record<string, unknown>): PlatformStaffModel {
  return {
    profileId: String(payload.profile_id),
    email: String(payload.email),
    fullName: (payload.full_name as string | null) ?? null,
    platformRole: payload.platform_role as PlatformRole,
    createdAt: String(payload.created_at),
  };
}

function mapCompanyRow(row: CompanyRow): CompanySubscriptionCurrentModel {
  return {
    companyId: String(row.company_id),
    companyName: String(row.company_name),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    ownerEmail: row.owner_email ? String(row.owner_email) : null,
    accountStatus: row.account_status as CompanyAccountStatus,
    suspendedAt: row.suspended_at ? String(row.suspended_at) : null,
    suspendedBy: row.suspended_by ? String(row.suspended_by) : null,
    suspensionReason: row.suspension_reason ? String(row.suspension_reason) : null,
    companyCreatedAt: String(row.company_created_at),
    subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
    subscriptionStatus: (row.subscription_status as SubscriptionStatus | null) ?? null,
    planCode: row.plan_code ? String(row.plan_code) : null,
    billingCycle: row.billing_cycle ? String(row.billing_cycle) : null,
    planAmount: row.plan_amount != null ? Number(row.plan_amount) : null,
    planCurrency: row.plan_currency ? String(row.plan_currency) : null,
    subscriptionStartsAt: row.subscription_starts_at
      ? String(row.subscription_starts_at)
      : null,
    subscriptionExpiresAt: row.subscription_expires_at
      ? String(row.subscription_expires_at)
      : null,
    nextRenewalAt: row.next_renewal_at ? String(row.next_renewal_at) : null,
    autoRenew: row.auto_renew != null ? Boolean(row.auto_renew) : null,
    cancelAtPeriodEnd:
      row.cancel_at_period_end != null ? Boolean(row.cancel_at_period_end) : null,
    subscriptionCancelledAt: row.subscription_cancelled_at
      ? String(row.subscription_cancelled_at)
      : null,
    usersCount: Number(row.users_count ?? 0),
    documentsCount: Number(row.documents_count ?? 0),
    latestActivityAt: row.latest_activity_at ? String(row.latest_activity_at) : null,
  };
}

function mapPaymentRow(row: PaymentRow): PlatformPaymentModel {
  const companies = row.companies as { name?: string } | null;
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyName: companies?.name ?? null,
    subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
    gateway: row.gateway as PaymentGateway,
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    status: row.status as PaymentStatus,
    gatewayReference: row.gateway_reference ? String(row.gateway_reference) : null,
    checkoutSessionId: row.checkout_session_id ? String(row.checkout_session_id) : null,
    providerEventId: row.provider_event_id ? String(row.provider_event_id) : null,
    paidAt: row.paid_at ? String(row.paid_at) : null,
    failedAt: row.failed_at ? String(row.failed_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapActionRow(row: ActionRow): PlatformAdminActionModel {
  return {
    id: String(row.id),
    adminUserId: String(row.admin_user_id),
    action: String(row.action),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

function mapDashboardStats(raw: Record<string, unknown>): PlatformDashboardStatsModel {
  return {
    totalCompanies: Number(raw.total_companies ?? 0),
    activeCompanies: Number(raw.active_companies ?? 0),
    trialingCompanies: Number(raw.trialing_companies ?? 0),
    expiredCompanies: Number(raw.expired_companies ?? 0),
    suspendedCompanies: Number(raw.suspended_companies ?? 0),
    accountSuspendedCompanies: Number(raw.account_suspended_companies ?? 0),
    totalRevenue: Number(raw.total_revenue ?? 0),
    pendingPayments: Number(raw.pending_payments ?? 0),
    generatedAt: String(raw.generated_at ?? new Date().toISOString()),
  };
}

function applyCompanyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  listQuery: PlatformListQuery
) {
  let q = query;

  if (listQuery.status) {
    q = q.eq("account_status", listQuery.status);
  }

  if (listQuery.subscriptionStatus) {
    q = q.eq("subscription_status", listQuery.subscriptionStatus);
  }

  if (listQuery.search) {
    const term = listQuery.search.replace(/[%]/g, "");
    q = q.or(`company_name.ilike.%${term}%,owner_email.ilike.%${term}%`);
  }

  return q;
}

export class PlatformRepository implements PlatformRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async getDashboardStats(): Promise<PlatformDashboardStatsModel> {
    const { data, error } = await this.supabase.rpc("platform_dashboard_stats");

    if (error) throw toRpcRepositoryError(error, "Failed to load dashboard stats");
    if (!data || typeof data !== "object") {
      throw new RepositoryError("RPC_ERROR", "Invalid dashboard stats response");
    }

    return mapDashboardStats(data as Record<string, unknown>);
  }

  async listCompanies(
    query: PlatformListQuery
  ): Promise<PlatformListResult<CompanySubscriptionCurrentModel>> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("company_subscription_current")
      .select("*", { count: "exact" })
      .order("company_created_at", { ascending: false });

    builder = applyCompanyFilters(builder, query);

    const { data, error, count } = await builder.range(from, to);

    if (error) throw toRepositoryError(error, "Failed to list companies");

    return {
      items: ((data ?? []) as CompanyRow[]).map(mapCompanyRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async getCompanyById(companyId: string): Promise<CompanySubscriptionCurrentModel | null> {
    const { data, error } = await this.supabase
      .from("company_subscription_current")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load company");
    if (!data) return null;
    return mapCompanyRow(data as CompanyRow);
  }

  async setCompanyStatus(
    companyId: string,
    status: CompanyAccountStatus,
    reason?: string
  ): Promise<SetCompanyStatusResult> {
    const { data, error } = await this.supabase.rpc("platform_set_company_status", {
      p_company_id: companyId,
      p_status: status,
      p_reason: reason ?? null,
    });

    if (error) throw toRpcRepositoryError(error, "Failed to set company status");

    const payload = data as Record<string, unknown>;
    return {
      ok: Boolean(payload.ok),
      companyId: String(payload.company_id),
      accountStatus: payload.account_status as CompanyAccountStatus,
    };
  }

  async listSubscriptions(
    query: PlatformListQuery
  ): Promise<PlatformListResult<CompanySubscriptionCurrentModel>> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("company_subscription_current")
      .select("*", { count: "exact" })
      .not("subscription_id", "is", null)
      .order("subscription_expires_at", { ascending: true, nullsFirst: false });

    builder = applyCompanyFilters(builder, query);

    const { data, error, count } = await builder.range(from, to);

    if (error) throw toRepositoryError(error, "Failed to list subscriptions");

    return {
      items: ((data ?? []) as CompanyRow[]).map(mapCompanyRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async extendSubscription(
    companyId: string,
    newExpiresAt: string,
    reason?: string
  ): Promise<ExtendSubscriptionResult> {
    const { data, error } = await this.supabase.rpc("platform_extend_subscription", {
      p_company_id: companyId,
      p_new_expires_at: newExpiresAt,
      p_reason: reason ?? null,
    });

    if (error) throw toRpcRepositoryError(error, "Failed to extend subscription");

    const payload = data as Record<string, unknown>;
    return {
      ok: Boolean(payload.ok),
      subscriptionId: String(payload.subscription_id),
      companyId: String(payload.company_id),
      status: payload.status as SubscriptionStatus,
      expiresAt: String(payload.expires_at),
    };
  }

  async listPayments(
    query: PlatformListQuery
  ): Promise<PlatformListResult<PlatformPaymentModel>> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("payments")
      .select(
        "id, company_id, subscription_id, gateway, amount, currency, status, gateway_reference, checkout_session_id, provider_event_id, paid_at, failed_at, created_at, companies(name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (query.paymentStatus) {
      builder = builder.eq("status", query.paymentStatus);
    }

    if (query.companyId) {
      builder = builder.eq("company_id", query.companyId);
    }

    if (query.search) {
      const term = query.search.replace(/[%]/g, "");
      builder = builder.or(
        `gateway_reference.ilike.%${term}%,checkout_session_id.ilike.%${term}%`
      );
    }

    const { data, error, count } = await builder.range(from, to);

    if (error) throw toRepositoryError(error, "Failed to list payments");

    return {
      items: ((data ?? []) as PaymentRow[]).map(mapPaymentRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async listAdminActions(
    query: PlatformListQuery
  ): Promise<PlatformListResult<PlatformAdminActionModel>> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("platform_admin_actions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (query.search) {
      const term = query.search.replace(/[%]/g, "");
      builder = builder.or(`action.ilike.%${term}%,entity_type.ilike.%${term}%`);
    }

    const { data, error, count } = await builder.range(from, to);

    if (error) throw toRepositoryError(error, "Failed to list platform actions");

    return {
      items: ((data ?? []) as ActionRow[]).map(mapActionRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async listStaff(
    query: PlatformListQuery
  ): Promise<PlatformListResult<PlatformStaffModel>> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("profiles")
      .select("id, email, full_name, platform_role, created_at", { count: "exact" })
      .not("platform_role", "is", null)
      .order("created_at", { ascending: false });

    if (query.search) {
      const term = query.search.replace(/[%]/g, "");
      builder = builder.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
    }

    const { data, error, count } = await builder.range(from, to);

    if (error) throw toRepositoryError(error, "Failed to list platform staff");

    return {
      items: ((data ?? []) as StaffRow[]).map(mapStaffRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async addStaff(email: string, role: PlatformRole): Promise<PlatformStaffModel> {
    const { data, error } = await this.supabase.rpc("platform_add_staff", {
      p_email: email,
      p_platform_role: role,
    });

    if (error) throw toRpcRepositoryError(error, "Failed to add platform staff");
    if (!data || typeof data !== "object") {
      throw new RepositoryError("RPC_ERROR", "Invalid add staff response");
    }

    return mapStaffFromRpc(data as Record<string, unknown>);
  }

  async changeStaffRole(profileId: string, role: PlatformRole): Promise<PlatformStaffModel> {
    const { data, error } = await this.supabase.rpc("platform_change_staff_role", {
      p_profile_id: profileId,
      p_platform_role: role,
    });

    if (error) throw toRpcRepositoryError(error, "Failed to change platform staff role");
    if (!data || typeof data !== "object") {
      throw new RepositoryError("RPC_ERROR", "Invalid change staff role response");
    }

    return mapStaffFromRpc(data as Record<string, unknown>);
  }

  async removeStaff(profileId: string): Promise<{ ok: boolean; profileId: string }> {
    const { data, error } = await this.supabase.rpc("platform_remove_staff", {
      p_profile_id: profileId,
    });

    if (error) throw toRpcRepositoryError(error, "Failed to remove platform staff");
    const payload = data as Record<string, unknown> | null;

    return {
      ok: Boolean(payload?.ok),
      profileId: String(payload?.profile_id ?? profileId),
    };
  }
}
