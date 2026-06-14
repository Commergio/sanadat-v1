import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/application/shared/pagination";
import type { CouponListQuery } from "@/application/coupons/types";

export function parseCouponListQuery(searchParams: URLSearchParams): CouponListQuery {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(Math.floor(limitRaw), MAX_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;

  const activeParam = searchParams.get("active");
  let active: boolean | undefined;
  if (activeParam === "true") active = true;
  if (activeParam === "false") active = false;

  return {
    page,
    limit,
    search: searchParams.get("search")?.trim() || undefined,
    active,
  };
}
