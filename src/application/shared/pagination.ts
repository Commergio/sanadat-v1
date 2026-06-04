export interface PaginationModel {
  cursor?: string;
  limit?: number;
}

export interface PaginatedModel<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizePageSize(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
}
