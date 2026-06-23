"use client";

import { useCallback, useEffect, useState } from "react";
import type { SubscriptionStatus } from "@/lib/types";

export interface TrialUsageApi {
  subscriptionStatus: SubscriptionStatus | null;
  receiptsCount: number;
  paymentsCount: number;
  invoicesCount: number;
  totalDocuments: number;
  trialLimit: number;
  remainingDocuments: number | null;
  canCreateDocument: boolean;
}

export function useTrialUsage() {
  const [usage, setUsage] = useState<TrialUsageApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/trial-usage", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setUsage(null);
        setError(payload?.error?.message ?? "Failed to load trial usage");
        return;
      }
      setUsage(payload as TrialUsageApi);
    } catch {
      setUsage(null);
      setError("Failed to load trial usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { usage, loading, error, refresh };
}
