import type { PaginationModel } from "@/application/shared/pagination";
import { normalizePageSize } from "@/application/shared/pagination";

type Row = Record<string, unknown>;

function encodeCursor(row: Row): string {
  return String(row.created_at);
}

export function applyCursorPagination(query: any, params: PaginationModel) {
  const limit = normalizePageSize(params.limit);
  let scoped = query.order("created_at", { ascending: false }).limit(limit + 1);
  if (params.cursor) {
    scoped = scoped.lt("created_at", params.cursor);
  }
  return { query: scoped, limit };
}

export function finalizePagination<T extends Row>(
  rows: T[] | null,
  limit: number
) {
  const data = rows ?? [];
  const hasMore = data.length > limit;
  const sliced = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? encodeCursor(sliced[sliced.length - 1]) : null;
  return { sliced, hasMore, nextCursor };
}
