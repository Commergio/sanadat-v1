"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { resolvePlatformStaffRole } from "@/lib/auth/platform-staff";
import { isSupabaseConfigured } from "@/lib/env";
import {
  buildPlatformListUrl,
  platformApiFetch,
  type CompanySubscriptionCurrentModel,
  type PlatformAdminActionModel,
  type PlatformApiError,
  type PlatformDashboardResponse,
  type PlatformCompanyResponse,
  type PlatformDashboardStatsModel,
  type PlatformExtendResult,
  type PlatformListResponse,
  type PlatformPaymentModel,
  type PlatformSession,
  type PlatformStatusResult,
} from "@/lib/platform/api-client";
import type { CompanyAccountStatus } from "@/application/platform/types";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/types";

export function usePlatformSession() {
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setSession(null);
        setLoading(false);
        return;
      }
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSession(null);
          return;
        }
        const role = await resolvePlatformStaffRole(supabase, user.id);
        if (role) {
          setSession({ role, isAdmin: role === "platform_admin" });
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { session, loading, canManage: session?.isAdmin ?? false };
}

export function usePlatformDashboard() {
  const [stats, setStats] = useState<PlatformDashboardStatsModel | null>(null);
  const [recentActions, setRecentActions] = useState<PlatformAdminActionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, actions] = await Promise.all([
        platformApiFetch<PlatformDashboardResponse>("/api/platform/dashboard"),
        platformApiFetch<PlatformListResponse<PlatformAdminActionModel>>(
          buildPlatformListUrl("/api/platform/actions", { page: 1, limit: 10 })
        ),
      ]);
      setStats(dash.stats);
      setRecentActions(actions.items);
    } catch (err) {
      setError(err as PlatformApiError);
      setStats(null);
      setRecentActions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, recentActions, loading, error, refresh };
}

export interface CompanyListParams {
  search?: string;
  status?: CompanyAccountStatus;
  subscriptionStatus?: SubscriptionStatus;
  page: number;
  limit?: number;
}

export function usePlatformCompanies(params: CompanyListParams) {
  const [data, setData] = useState<PlatformListResponse<CompanySubscriptionCurrentModel> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/companies", {
        search: params.search,
        status: params.status,
        subscription_status: params.subscriptionStatus,
        page: params.page,
        limit: params.limit ?? 20,
      });
      const result = await platformApiFetch<PlatformListResponse<CompanySubscriptionCurrentModel>>(
        url
      );
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.search, params.status, params.subscriptionStatus, params.page, params.limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

function filterActionsForCompany(
  items: PlatformAdminActionModel[],
  companyId: string
): PlatformAdminActionModel[] {
  return items.filter((row) => {
    if (row.entityId === companyId) return true;
    const metaCompanyId = row.metadata?.company_id;
    return typeof metaCompanyId === "string" && metaCompanyId === companyId;
  });
}

export function usePlatformCompany(companyId: string) {
  const [company, setCompany] = useState<CompanySubscriptionCurrentModel | null>(null);
  const [payments, setPayments] = useState<PlatformPaymentModel[]>([]);
  const [companyActions, setCompanyActions] = useState<PlatformAdminActionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyRes, paymentsRes, actionsRes] = await Promise.all([
        platformApiFetch<PlatformCompanyResponse>(`/api/platform/companies/${companyId}`),
        platformApiFetch<PlatformListResponse<PlatformPaymentModel>>(
          buildPlatformListUrl("/api/platform/payments", {
            company_id: companyId,
            page: 1,
            limit: 10,
          })
        ),
        platformApiFetch<PlatformListResponse<PlatformAdminActionModel>>(
          buildPlatformListUrl("/api/platform/actions", { page: 1, limit: 100 })
        ),
      ]);
      setCompany(companyRes.company);
      setPayments(paymentsRes.items);
      setCompanyActions(
        filterActionsForCompany(actionsRes.items, companyId).slice(0, 10)
      );
    } catch (err) {
      setError(err as PlatformApiError);
      setCompany(null);
      setPayments([]);
      setCompanyActions([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { company, payments, companyActions, loading, error, refresh };
}

export async function setPlatformCompanyStatus(
  companyId: string,
  status: CompanyAccountStatus,
  reason?: string
) {
  return platformApiFetch<{ result: PlatformStatusResult }>(
    `/api/platform/companies/${companyId}/status`,
    {
      method: "POST",
      body: JSON.stringify({ status, reason }),
    }
  );
}

export async function extendPlatformSubscription(
  companyId: string,
  newExpiresAt: string,
  reason?: string
) {
  return platformApiFetch<{ result: PlatformExtendResult }>(
    `/api/platform/subscriptions/${companyId}/extend`,
    {
      method: "POST",
      body: JSON.stringify({ new_expires_at: newExpiresAt, reason }),
    }
  );
}

export function usePlatformSubscriptions(params: {
  subscriptionStatus?: SubscriptionStatus;
  page: number;
  limit?: number;
}) {
  const [data, setData] = useState<PlatformListResponse<CompanySubscriptionCurrentModel> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/subscriptions", {
        subscription_status: params.subscriptionStatus,
        page: params.page,
        limit: params.limit ?? 20,
      });
      const result = await platformApiFetch<PlatformListResponse<CompanySubscriptionCurrentModel>>(
        url
      );
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.subscriptionStatus, params.page, params.limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function usePlatformPayments(params: {
  paymentStatus?: PaymentStatus;
  page: number;
  limit?: number;
}) {
  const [data, setData] = useState<PlatformListResponse<PlatformPaymentModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/payments", {
        payment_status: params.paymentStatus,
        page: params.page,
        limit: params.limit ?? 20,
      });
      const result = await platformApiFetch<PlatformListResponse<PlatformPaymentModel>>(url);
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.paymentStatus, params.page, params.limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function usePlatformActions(params: { page: number; limit?: number; search?: string }) {
  const [data, setData] = useState<PlatformListResponse<PlatformAdminActionModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/actions", {
        search: params.search,
        page: params.page,
        limit: params.limit ?? 20,
      });
      const result = await platformApiFetch<PlatformListResponse<PlatformAdminActionModel>>(url);
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
