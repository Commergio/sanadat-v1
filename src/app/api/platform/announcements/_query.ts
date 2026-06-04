import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/application/shared/pagination";
import type { AnnouncementListQuery } from "@/application/announcements/repository-ports";

export function parseAnnouncementListQuery(
  searchParams: URLSearchParams
): AnnouncementListQuery {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(Math.floor(limitRaw), MAX_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;

  return {
    page,
    limit,
    search: searchParams.get("search")?.trim() || undefined,
  };
}
