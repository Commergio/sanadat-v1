"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import {
  buildDemoCompany,
  loadStoredCompany,
  saveStoredCompany,
} from "@/lib/company-local-storage";
import { IS_DEMO_MODE } from "@/lib/constants";
import type { Company } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export function useCompany() {
  const { company: storeCompany, setCompany } = useAppStore();
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    if (IS_DEMO_MODE) {
      const stored = loadStoredCompany();
      setCompany(buildDemoCompany(stored));
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCompany(null);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompany(data as Company);
      }
    } catch {
      setCompany(buildDemoCompany(loadStoredCompany()));
    } finally {
      setLoading(false);
    }
  }, [setCompany]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const updateCompanyInStore = useCallback(
    (updates: Partial<Company>) => {
      if (storeCompany) {
        const next = {
          ...storeCompany,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        setCompany(next);
        if (IS_DEMO_MODE) {
          saveStoredCompany(next);
        }
      }
    },
    [storeCompany, setCompany]
  );

  return {
    company: storeCompany,
    loading,
    refresh: fetchCompany,
    updateCompanyInStore,
  };
}

/** Fallback company when store is empty (SSR / first paint). */
export function getDefaultCompany(): Company {
  return buildDemoCompany();
}
