"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPlatformListUrl,
  platformApiFetch,
  type PlatformApiError,
  type PlatformListResponse,
} from "@/lib/platform/api-client";
import type { InvitationPromoCodeModel } from "@/application/invitation-codes/types";

export interface InvitationCodeFormInput {
  code: string;
  name: string;
  description: string | null;
  duration_days: number;
  max_redemptions: number | null;
  per_company_limit: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
}

export type InvitationStatusFilter = "all" | "active" | "inactive" | "expired";

export function usePlatformInvitationCodes(params: {
  page: number;
  search?: string;
  statusFilter: InvitationStatusFilter;
}) {
  const [data, setData] = useState<PlatformListResponse<InvitationPromoCodeModel> | null>(null);
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

      const url = buildPlatformListUrl("/api/platform/invitation-codes", {
        search: params.search,
        page: params.page,
        limit: 20,
        ...(activeParam !== undefined ? { active: String(activeParam) } : {}),
      });
      const result = await platformApiFetch<PlatformListResponse<InvitationPromoCodeModel>>(url);
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

export async function createPlatformInvitationCode(input: InvitationCodeFormInput) {
  return platformApiFetch<{ promo: InvitationPromoCodeModel }>("/api/platform/invitation-codes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePlatformInvitationCode(
  id: string,
  input: Partial<InvitationCodeFormInput>
) {
  return platformApiFetch<{ promo: InvitationPromoCodeModel }>(
    `/api/platform/invitation-codes/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

export async function deletePlatformInvitationCode(id: string) {
  return platformApiFetch<{ ok: boolean }>(`/api/platform/invitation-codes/${id}`, {
    method: "DELETE",
  });
}

export interface ApplyInvitationCodeResponse {
  success: boolean;
  code: string;
  grantedDays: number;
  startsAt: string;
  expiresAt: string;
  subscriptionStatus: string;
  subscriptionSource: string;
}

export async function applyInvitationCode(code: string): Promise<ApplyInvitationCodeResponse> {
  const res = await fetch("/api/billing/invitation-code/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const payload = await res.json();
  if (!res.ok) {
    throw {
      code: payload?.error?.code ?? "INTERNAL",
      message: payload?.error?.message ?? "Failed to apply invitation code",
    } satisfies PlatformApiError;
  }
  return payload as ApplyInvitationCodeResponse;
}

export const PENDING_INVITATION_CODE_KEY = "pending_invitation_code";
