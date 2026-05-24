"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { IS_DEMO_MODE } from "@/lib/constants";
import { mockCompany } from "@/lib/mock-data";
import type { Company } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

export function useCompany() {
  const { company: storeCompany, setCompany } = useAppStore();
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    if (IS_DEMO_MODE) {
      setCompany(mockCompany as unknown as Company);
      setLoading(false);
      return;
    }

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
      setCompany(mockCompany as unknown as Company);
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
        setCompany({ ...storeCompany, ...updates });
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
