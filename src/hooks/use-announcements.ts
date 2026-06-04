"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPlatformListUrl,
  platformApiFetch,
  type PlatformApiError,
  type PlatformListResponse,
} from "@/lib/platform/api-client";
import type {
  AnnouncementModel,
  AnnouncementPriority,
  AnnouncementTargetType,
  TenantAnnouncementModel,
} from "@/application/announcements/types";

export interface AnnouncementFormInput {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  priority: AnnouncementPriority;
  published: boolean;
  start_at: string | null;
  end_at: string | null;
  target_type: AnnouncementTargetType;
  company_ids?: string[];
}

export function usePlatformAnnouncements(params: { page: number; search?: string }) {
  const [data, setData] = useState<PlatformListResponse<AnnouncementModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/announcements", {
        search: params.search,
        page: params.page,
        limit: 20,
      });
      const result = await platformApiFetch<PlatformListResponse<AnnouncementModel>>(url);
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

export async function createPlatformAnnouncement(input: AnnouncementFormInput) {
  return platformApiFetch<{ announcement: AnnouncementModel }>("/api/platform/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePlatformAnnouncement(id: string, input: Partial<AnnouncementFormInput>) {
  return platformApiFetch<{ announcement: AnnouncementModel }>(
    `/api/platform/announcements/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

export async function deletePlatformAnnouncement(id: string) {
  return platformApiFetch<{ ok: boolean }>(`/api/platform/announcements/${id}`, {
    method: "DELETE",
  });
}

export function useTenantAnnouncements() {
  const [items, setItems] = useState<TenantAnnouncementModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load announcements");
      }
      setItems((payload.items ?? []) as TenantAnnouncementModel[]);
    } catch (err) {
      setError((err as Error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export async function markTenantAnnouncementRead(id: string) {
  const res = await fetch(`/api/announcements/${id}/read`, { method: "POST" });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error?.message ?? "Failed to mark as read");
  }
  return payload;
}
