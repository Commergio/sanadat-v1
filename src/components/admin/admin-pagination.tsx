"use client";

import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  labels: { prev: string; next: string; page: string };
}

export function AdminPagination({
  page,
  limit,
  total,
  onPageChange,
  labels,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (total <= limit) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        {labels.page} {page} / {totalPages} ({total})
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          {labels.prev}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  );
}
