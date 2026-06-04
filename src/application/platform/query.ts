import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/application/shared/pagination";
import type { CompanyAccountStatus } from "./types";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/types";

export interface PlatformListQuery {
  search?: string;
  status?: CompanyAccountStatus;
  subscriptionStatus?: SubscriptionStatus;
  paymentStatus?: PaymentStatus;
  companyId?: string;
  page: number;
  limit: number;
}

export function parsePlatformListQuery(
  searchParams: URLSearchParams
): PlatformListQuery {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(Math.floor(limitRaw), MAX_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;

  const statusParam = searchParams.get("status");
  const status =
    statusParam === "active" || statusParam === "suspended" ? statusParam : undefined;

  const subscriptionStatus = searchParams.get("subscription_status") as
    | SubscriptionStatus
    | null;
  const validSubStatuses = new Set([
    "active",
    "trialing",
    "expired",
    "suspended",
    "cancelled",
  ]);

  const paymentStatus = searchParams.get("payment_status") as PaymentStatus | null;
  const validPayStatuses = new Set(["pending", "completed", "failed", "refunded"]);

  const companyId = searchParams.get("company_id")?.trim();

  return {
    search: searchParams.get("search")?.trim() || undefined,
    companyId: companyId && companyId.length > 0 ? companyId : undefined,
    status,
    subscriptionStatus:
      subscriptionStatus && validSubStatuses.has(subscriptionStatus)
        ? subscriptionStatus
        : undefined,
    paymentStatus:
      paymentStatus && validPayStatuses.has(paymentStatus) ? paymentStatus : undefined,
    page,
    limit,
  };
}
