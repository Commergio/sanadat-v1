import type { PlatformRole } from "@/lib/types";
import type {
  CompanySubscriptionCurrentModel,
  PlatformAdminActionModel,
  PlatformDashboardStatsModel,
  PlatformListResult,
  PlatformPaymentModel,
} from "@/application/platform/types";

export interface PlatformApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type {
  CompanySubscriptionCurrentModel,
  PlatformAdminActionModel,
  PlatformDashboardStatsModel,
  PlatformPaymentModel,
};

export interface PlatformListResponse<T> extends PlatformListResult<T> {}

export interface PlatformDashboardResponse {
  stats: PlatformDashboardStatsModel;
}

export interface PlatformCompanyResponse {
  company: CompanySubscriptionCurrentModel;
}

export interface PlatformStatusResult {
  ok: boolean;
  companyId: string;
  accountStatus: "active" | "suspended";
}

export interface PlatformExtendResult {
  ok: boolean;
  subscriptionId: string;
  companyId: string;
  status: string;
  expiresAt: string;
}

export function mapPlatformApiError(
  payload: { error?: PlatformApiError } | null,
  fallback: string
): PlatformApiError {
  return {
    code: payload?.error?.code ?? "INTERNAL",
    message: payload?.error?.message ?? fallback,
    details: payload?.error?.details,
  };
}

export async function platformApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = await res.json();

  if (!res.ok) {
    throw mapPlatformApiError(payload, `Request failed: ${path}`);
  }

  return payload as T;
}

export function buildPlatformListUrl(
  base: string,
  params: Record<string, string | number | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export interface PlatformSession {
  role: PlatformRole;
  isAdmin: boolean;
}
