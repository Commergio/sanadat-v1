"use client";

import { useEffect, useState } from "react";

/** Brief skeleton flash to simulate data fetch in demo mode. */
export function useAdminLoading(delayMs = 420) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return loading;
}
