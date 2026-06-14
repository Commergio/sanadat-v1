"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPlatformListUrl,
  platformApiFetch,
  type PlatformApiError,
  type PlatformListResponse,
} from "@/lib/platform/api-client";
import type { DiscountCouponModel, DiscountCouponType } from "@/application/coupons/types";

export interface CouponFormInput {
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountCouponType;
  discount_value: number;
  currency: string;
  max_redemptions: number | null;
  per_company_limit: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
}

export type CouponStatusFilter = "all" | "active" | "inactive" | "expired";

export function usePlatformCoupons(params: {
  page: number;
  search?: string;
  statusFilter: CouponStatusFilter;
}) {
  const [data, setData] = useState<PlatformListResponse<DiscountCouponModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeParam =
        params.statusFilter === "active"
          ? true
          : params.statusFilter === "inactive"
            ? false
            : undefined;

      const url = buildPlatformListUrl("/api/platform/coupons", {
        search: params.search,
        page: params.page,
        limit: 20,
        ...(activeParam !== undefined ? { active: String(activeParam) } : {}),
      });
      const result = await platformApiFetch<PlatformListResponse<DiscountCouponModel>>(url);
      let items = result.items;

      if (params.statusFilter === "expired") {
        const now = Date.now();
        items = items.filter((item) => {
          if (!item.expiresAt) return false;
          const expires = new Date(item.expiresAt).getTime();
          return !Number.isNaN(expires) && expires < now;
        });
      }

      setData({ ...result, items });
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.search, params.statusFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export async function createPlatformCoupon(input: CouponFormInput) {
  return platformApiFetch<{ coupon: DiscountCouponModel }>("/api/platform/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePlatformCoupon(id: string, input: Partial<CouponFormInput>) {
  return platformApiFetch<{ coupon: DiscountCouponModel }>(`/api/platform/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deletePlatformCoupon(id: string) {
  return platformApiFetch<{ ok: boolean }>(`/api/platform/coupons/${id}`, {
    method: "DELETE",
  });
}

export interface CouponValidateResponse {
  valid: boolean;
  coupon_code: string | null;
  discount_type: DiscountCouponType | null;
  discount_value: number | null;
  original_amount: number | null;
  discount_amount: number | null;
  final_amount: number | null;
  message: string;
}

export async function validateBillingCoupon(input: {
  code: string;
  plan_code: string;
  billing_cycle: "yearly";
}): Promise<CouponValidateResponse> {
  const res = await fetch("/api/billing/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error?.message ?? "Failed to validate coupon");
  }
  return payload as CouponValidateResponse;
}
