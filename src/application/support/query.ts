import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/application/shared/pagination";
import type { SupportTicketPriority, SupportTicketStatus } from "./types";

export interface SupportTicketListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  companyId?: string;
}

export function parseSupportTicketListQuery(
  searchParams: URLSearchParams
): SupportTicketListQuery {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(Math.floor(limitRaw), MAX_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;

  const statusParam = searchParams.get("status");
  const validStatuses = new Set(["open", "in_progress", "resolved", "closed"]);
  const priorityParam = searchParams.get("priority");
  const validPriorities = new Set(["low", "normal", "high", "urgent"]);

  return {
    page,
    limit,
    search: searchParams.get("search")?.trim() || undefined,
    status:
      statusParam && validStatuses.has(statusParam)
        ? (statusParam as SupportTicketStatus)
        : undefined,
    priority:
      priorityParam && validPriorities.has(priorityParam)
        ? (priorityParam as SupportTicketPriority)
        : undefined,
    companyId: searchParams.get("company_id")?.trim() || undefined,
  };
}
