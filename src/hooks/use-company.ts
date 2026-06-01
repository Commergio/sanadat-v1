"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { Company, Subscription } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/tenant/constants";
import { mapCompanyRow, mapSubscriptionRow } from "@/lib/tenant/mappers";

function getActiveCompanyIdFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACTIVE_COMPANY_COOKIE}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function useCompany() {
  const { company: storeCompany, subscription, setCompany, setSubscription } =
    useAppStore();
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCompany(null);
      setSubscription(null);
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
        setSubscription(null);
        return;
      }

      const preferredCompanyId = getActiveCompanyIdFromDocument();

      const membershipQuery = supabase
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", user.id);

      const { data: memberships, error: memberError } = preferredCompanyId
        ? await membershipQuery
        : await membershipQuery.order("accepted_at", { ascending: false });

      if (memberError) throw memberError;
      if (!memberships?.length) {
        setCompany(null);
        setSubscription(null);
        return;
      }

      const active =
        memberships.find((m) => m.company_id === preferredCompanyId) ??
        memberships[0];

      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", active.company_id)
        .maybeSingle();

      if (companyError) throw companyError;
      if (!companyRow) {
        setCompany(null);
        return;
      }

      setCompany(mapCompanyRow(companyRow as Record<string, unknown>));

      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("company_id", active.company_id)
        .in("status", ["active", "trialing"])
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(
        subRow
          ? mapSubscriptionRow(subRow as Record<string, unknown>)
          : null
      );
    } catch {
      setCompany(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [setCompany, setSubscription]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const updateCompanyInStore = useCallback(
    (updates: Partial<Company>) => {
      if (storeCompany) {
        setCompany({
          ...storeCompany,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }
    },
    [storeCompany, setCompany]
  );

  return {
    company: storeCompany,
    subscription,
    loading,
    refresh: fetchCompany,
    updateCompanyInStore,
  };
}
