"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dashboard-card overflow-hidden p-0">
      <div className="flex gap-3 border-b border-border/80 p-4">
        <Skeleton className="h-10 max-w-sm flex-1 rounded-lg" />
        <Skeleton className="h-10 w-[180px] rounded-lg" />
      </div>
      <div className="space-y-0 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-12 w-full rounded-lg last:mb-0" />
        ))}
      </div>
    </div>
  );
}

export function AdminCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[260px] rounded-xl" />
      ))}
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-10 w-36 rounded-lg" />
    </div>
  );
}
