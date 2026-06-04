"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPlatformListUrl,
  platformApiFetch,
  type PlatformApiError,
  type PlatformListResponse,
} from "@/lib/platform/api-client";
import type {
  SupportTicketDetailModel,
  SupportTicketListResult,
  SupportTicketModel,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/application/support/types";

export interface SupportListParams {
  page: number;
  limit?: number;
  search?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  companyId?: string;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
}

export interface UpdateTicketInput {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assigned_to?: string | null;
}

export interface AddNoteInput {
  body: string;
  internal_only?: boolean;
}

async function tenantFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw {
      code: payload?.error?.code ?? "INTERNAL",
      message: payload?.error?.message ?? "Request failed",
      details: payload?.error?.details,
    } as PlatformApiError;
  }
  return payload as T;
}

export function useTenantSupportTickets(params: SupportListParams) {
  const [data, setData] = useState<SupportTicketListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/support/tickets", {
        page: params.page,
        limit: params.limit ?? 20,
        search: params.search,
        status: params.status,
        priority: params.priority,
      });
      const result = await tenantFetch<SupportTicketListResult>(url);
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.search, params.status, params.priority]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useTenantSupportTicket(id: string | null) {
  const [detail, setDetail] = useState<SupportTicketDetailModel | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await tenantFetch<SupportTicketDetailModel>(
        `/api/support/tickets/${id}`
      );
      setDetail(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, error, refresh };
}

export async function createTenantSupportTicket(input: CreateTicketInput) {
  return tenantFetch<{ ticket: SupportTicketModel }>("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addTenantSupportNote(ticketId: string, body: string) {
  return tenantFetch<{ note: SupportTicketDetailModel["notes"][number] }>(
    `/api/support/tickets/${ticketId}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    }
  );
}

export function usePlatformSupportTickets(params: SupportListParams) {
  const [data, setData] = useState<PlatformListResponse<SupportTicketModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildPlatformListUrl("/api/platform/support/tickets", {
        page: params.page,
        limit: params.limit ?? 20,
        search: params.search,
        status: params.status,
        priority: params.priority,
        company_id: params.companyId,
      });
      const result = await platformApiFetch<PlatformListResponse<SupportTicketModel>>(url);
      setData(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    params.page,
    params.limit,
    params.search,
    params.status,
    params.priority,
    params.companyId,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function usePlatformSupportTicket(id: string | null) {
  const [detail, setDetail] = useState<SupportTicketDetailModel | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<PlatformApiError | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await platformApiFetch<SupportTicketDetailModel>(
        `/api/platform/support/tickets/${id}`
      );
      setDetail(result);
    } catch (err) {
      setError(err as PlatformApiError);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, error, refresh };
}

export async function updatePlatformSupportTicket(id: string, input: UpdateTicketInput) {
  return platformApiFetch<{ ticket: SupportTicketModel }>(
    `/api/platform/support/tickets/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

export async function addPlatformSupportNote(ticketId: string, input: AddNoteInput) {
  return platformApiFetch<{ note: SupportTicketDetailModel["notes"][number] }>(
    `/api/platform/support/tickets/${ticketId}/notes`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}
