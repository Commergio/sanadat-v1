"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlatformApiError } from "@/lib/platform/api-client";

interface AdminErrorBannerProps {
  error: PlatformApiError | null;
  onRetry?: () => void;
  retryLabel?: string;
}

export function AdminErrorBanner({ error, onRetry, retryLabel = "Retry" }: AdminErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-destructive">{error.code}</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
