"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPlatformListUrl,
  mapPlatformApiError,
  platformApiFetch,
  type PlatformApiError,
  type PlatformListResponse,
} from "@/lib/platform/api-client";

export type ManualPaymentStatus = "pending" | "approved" | "rejected";

export interface ManualPaymentListItem {
  id: string;
  companyId: string;
  companyName: string | null;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: "yearly";
  status: ManualPaymentStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ManualPaymentDetail extends ManualPaymentListItem {
  requestedBy: string;
  reviewedBy: string | null;
  updatedAt: string;
  proofUrl: string | null;
}

export function useManualPayments(params: {
  status?: ManualPaymentStatus;
  page: number;
  limit?: number;
}) {
  const [data, setData] = useState<PlatformListResponse<ManualPaymentListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/manual-payments", {
        status: params.status,
        page: params.page,
        limit: params.limit ?? 20,
      });
      const result = await platformApiFetch<PlatformListResponse<ManualPaymentListItem>>(url);
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.status, params.page, params.limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export async function fetchManualPaymentDetail(id: string): Promise<ManualPaymentDetail> {
  const res = await platformApiFetch<{ request: ManualPaymentDetail }>(
    `/api/platform/manual-payments/${id}`
  );
  return res.request;
}

export async function approveManualPayment(id: string, adminNote?: string) {
  return platformApiFetch(`/api/platform/manual-payments/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_note: adminNote ?? "" }),
  });
}

export async function rejectManualPayment(id: string, adminNote: string) {
  return platformApiFetch(`/api/platform/manual-payments/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_note: adminNote }),
  });
}

export function mapManualPaymentError(err: unknown, fallback: string): PlatformApiError {
  if (err && typeof err === "object" && "code" in err && "message" in err) {
    return err as PlatformApiError;
  }
  return mapPlatformApiError(null, fallback);
}
