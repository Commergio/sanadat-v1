"use client";

import { useCallback, useEffect, useState } from "react";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import type { TenantRole } from "@/lib/tenant/types";
import type {
  BillingPaymentApi,
  BillingSubscriptionApi,
  CheckoutResultApi,
} from "@/lib/billing/client";
import { mapBillingError } from "@/lib/billing/client";
import { useCompany } from "@/hooks/use-company";

export function useBilling() {
  const { tenantRole } = useCompany();
  const [subscription, setSubscription] = useState<BillingSubscriptionApi | null>(null);
  const [payments, setPayments] = useState<BillingPaymentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResultApi | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const canManage =
    tenantRole != null && hasMinimumTenantRole(tenantRole as TenantRole, "admin");

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [subRes, payRes] = await Promise.all([
        fetch("/api/billing/subscription", { cache: "no-store" }),
        fetch("/api/billing/payments", { cache: "no-store" }),
      ]);

      const subPayload = await subRes.json();
      const payPayload = await payRes.json();

      if (!subRes.ok) {
        setLoadError(mapBillingError(subPayload, "Failed to load subscription"));
        setSubscription(null);
      } else {
        setSubscription((subPayload.subscription as BillingSubscriptionApi | null) ?? null);
      }

      if (!payRes.ok) {
        setLoadError((prev) => prev ?? mapBillingError(payPayload, "Failed to load payments"));
        setPayments([]);
      } else {
        setPayments((payPayload.items as BillingPaymentApi[]) ?? []);
      }
    } catch {
      setLoadError({ code: "INTERNAL", message: "Failed to load billing data" });
      setSubscription(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutResult(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_code: "sanadat_annual",
          billing_cycle: "yearly",
          gateway: "manual",
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        const err = mapBillingError(payload, "Failed to start checkout");
        setCheckoutError(err.code === "FORBIDDEN" ? "FORBIDDEN" : err.message);
        return;
      }
      setCheckoutResult(payload as CheckoutResultApi);
      await refresh();
    } catch {
      setCheckoutError("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }, [refresh]);

  const latestPendingPayment = payments.find((p) => p.status === "pending");
  const latestFailedPayment = payments.find((p) => p.status === "failed");

  return {
    subscription,
    payments,
    loading,
    loadError,
    canManage,
    checkoutResult,
    checkoutLoading,
    checkoutError,
    startCheckout,
    refresh,
    latestPendingPayment,
    latestFailedPayment,
  };
}
