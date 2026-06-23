"use client";

import { useCallback, useEffect, useState } from "react";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import type { TenantRole } from "@/lib/tenant/types";
import {
  mapBillingError,
  mapPaymentFromApi,
  type BillingPaymentApi,
  type BillingSubscriptionApi,
  type CheckoutResultApi,
} from "@/lib/billing/client";
import { validateBillingCoupon, type CouponValidateResponse } from "@/hooks/use-coupons";
import { useCompany } from "@/hooks/use-company";

export interface ManualPaymentRequestApi {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: "yearly";
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useBilling() {
  const { tenantRole } = useCompany();
  const [subscription, setSubscription] = useState<BillingSubscriptionApi | null>(null);
  const [payments, setPayments] = useState<BillingPaymentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResultApi | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pendingManualRequest, setPendingManualRequest] = useState<ManualPaymentRequestApi | null>(
    null
  );

  const canManage =
    tenantRole != null && hasMinimumTenantRole(tenantRole as TenantRole, "admin");

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [subRes, payRes, manualRes] = await Promise.all([
        fetch("/api/billing/subscription", { cache: "no-store" }),
        fetch("/api/billing/payments", { cache: "no-store" }),
        fetch("/api/billing/manual-payment", { cache: "no-store" }),
      ]);

      const subPayload = await subRes.json();
      const payPayload = await payRes.json();
      const manualPayload = await manualRes.json();

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
        const rawItems = (payPayload.items ?? []) as Record<string, unknown>[];
        setPayments(rawItems.map(mapPaymentFromApi));
      }

      if (!manualRes.ok) {
        setPendingManualRequest(null);
      } else {
        setPendingManualRequest(
          (manualPayload.request as ManualPaymentRequestApi | null) ?? null
        );
      }
    } catch {
      setLoadError({ code: "INTERNAL", message: "Failed to load billing data" });
      setSubscription(null);
      setPayments([]);
      setPendingManualRequest(null);
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

  const applyCoupon = useCallback(async (): Promise<boolean> => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError(null);
      setAppliedCoupon(null);
      return false;
    }

    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await validateBillingCoupon({
        code,
        plan_code: "sanadat_annual",
        billing_cycle: "yearly",
      });
      if (!result.valid) {
        setAppliedCoupon(null);
        setCouponError(result.message);
        return false;
      }
      setAppliedCoupon(result);
      setCouponInput(result.coupon_code ?? code.toUpperCase());
      return true;
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError((err as Error).message);
      return false;
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput]);

  const clearCoupon = useCallback(() => {
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  const startCheckout = useCallback(async (): Promise<CheckoutResultApi | undefined> => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutResult(null);
    try {
      const body: Record<string, string> = {
        plan_code: "sanadat_annual",
        billing_cycle: "yearly",
        gateway: "moyasar",
      };
      if (appliedCoupon?.valid && appliedCoupon.coupon_code) {
        body.coupon_code = appliedCoupon.coupon_code;
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        const err = mapBillingError(payload, "Failed to start checkout");
        setCheckoutError(err.code === "FORBIDDEN" ? "FORBIDDEN" : err.message);
        return;
      }
      const result = payload as CheckoutResultApi;
      setCheckoutResult(result);
      await refresh();
      if (result.reusedPending) {
        return result;
      }
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      }
      return result;
    } catch {
      setCheckoutError("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }, [appliedCoupon, refresh]);

  const latestPayment = payments[0] ?? null;
  const latestPendingPayment =
    latestPayment?.status === "pending" ? latestPayment : undefined;
  const latestFailedPayment =
    latestPayment?.status === "failed" ? latestPayment : undefined;

  return {
    subscription,
    payments,
    loading,
    loadError,
    canManage,
    checkoutResult,
    checkoutLoading,
    checkoutError,
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponLoading,
    couponError,
    applyCoupon,
    clearCoupon,
    startCheckout,
    refresh,
    latestPayment,
    latestPendingPayment,
    latestFailedPayment,
    pendingManualRequest,
  };
}
