"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPlatformListUrl,
  platformApiFetch,
  type PlatformApiError,
  type PlatformListResponse,
} from "@/lib/platform/api-client";
import type { PlatformStaffModel } from "@/application/platform/types";
import type { PlatformRole } from "@/lib/types";

export interface AddPlatformStaffInput {
  email: string;
  platform_role: PlatformRole;
}

export function usePlatformStaff(params: { page: number; search?: string }) {
  const [data, setData] = useState<PlatformListResponse<PlatformStaffModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/staff", {
        search: params.search,
        page: params.page,
        limit: 20,
      });
      const result = await platformApiFetch<PlatformListResponse<PlatformStaffModel>>(url);
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export async function addPlatformStaff(input: AddPlatformStaffInput) {
  return platformApiFetch<{ staff: PlatformStaffModel }>("/api/platform/staff", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function changePlatformStaffRole(profileId: string, platform_role: PlatformRole) {
  return platformApiFetch<{ staff: PlatformStaffModel }>(`/api/platform/staff/${profileId}`, {
    method: "PATCH",
    body: JSON.stringify({ platform_role }),
  });
}

export async function removePlatformStaff(profileId: string) {
  return platformApiFetch<{ ok: boolean; profileId: string }>(
    `/api/platform/staff/${profileId}`,
    {
      method: "DELETE",
    }
  );
}
