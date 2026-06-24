"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Building2, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { mapBillingError } from "@/lib/billing/client";
import type { ManualPaymentRequestApi } from "@/hooks/use-billing";
import type { CouponValidateResponse } from "@/hooks/use-coupons";
import { SubscriptionCouponFields } from "@/components/subscription/subscription-coupon-fields";

interface ManualBankTransferSectionProps {
  canManage: boolean;
  pendingRequest: ManualPaymentRequestApi | null;
  onSubmitted: () => Promise<void>;
  couponInput: string;
  setCouponInput: (value: string) => void;
  appliedCoupon: CouponValidateResponse | null;
  couponLoading: boolean;
  couponError: string | null;
  onApplyCoupon: () => void | Promise<void>;
  onClearCoupon: () => void;
  /** When true, render inside the renew card without an outer Card wrapper. */
  embedded?: boolean;
}

export function ManualBankTransferSection({
  canManage,
  pendingRequest,
  onSubmitted,
  couponInput,
  setCouponInput,
  appliedCoupon,
  couponLoading,
  couponError,
  onApplyCoupon,
  onClearCoupon,
  embedded = false,
}: ManualBankTransferSectionProps) {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const showPending = Boolean(pendingRequest) || submitted;

  const transferAmount = useMemo(() => {
    if (appliedCoupon?.valid && appliedCoupon.final_amount != null) {
      return appliedCoupon.final_amount;
    }
    return SUBSCRIPTION_PRICE;
  }, [appliedCoupon]);

  const transferAmountLabel = formatCurrency(transferAmount, locale);

  const handleApplyCoupon = useCallback(async () => {
    await onApplyCoupon();
  }, [onApplyCoupon]);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError(t("manualTransferFileRequired"));
      return;
    }

    if (couponInput.trim() && !appliedCoupon?.valid) {
      setError(t("manualTransferCouponApplyRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("proof", file);
      form.append("plan_code", "sanadat_annual");
      form.append("billing_cycle", "yearly");
      form.append("amount", String(transferAmount));
      form.append("currency", "SAR");
      if (appliedCoupon?.valid && appliedCoupon.coupon_code) {
        form.append("coupon_code", appliedCoupon.coupon_code);
      }

      const res = await fetch("/api/billing/manual-payment", {
        method: "POST",
        body: form,
      });
      const payload = await res.json();
      if (!res.ok) {
        const err = mapBillingError(payload, t("manualTransferSubmitFailed"));
        if (err.code === "CONFLICT") {
          const message = t("manualTransferPendingExists");
          setError(message);
          toast.message(message);
          return;
        }
        setError(err.message);
        return;
      }

      setSubmitted(true);
      setFile(null);
      onClearCoupon();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(t("manualTransferSubmittedToast"));
      await onSubmitted();
    } catch {
      setError(t("manualTransferSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [
    appliedCoupon,
    couponInput,
    file,
    onClearCoupon,
    onSubmitted,
    t,
    transferAmount,
  ]);

  const body = (
    <div className="space-y-4">
      {canManage && !showPending && (
        <SubscriptionCouponFields
          locale={locale}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          appliedCoupon={appliedCoupon}
          couponLoading={couponLoading}
          couponError={couponError}
          onApply={handleApplyCoupon}
          onClear={onClearCoupon}
          disabled={submitting}
          inputId="manual-transfer-coupon-code"
        />
      )}

      <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t("manualTransferInstructionsTitle")}</p>
        <div className="mt-2 space-y-1">
          <p>{t("manualTransferIntro", { amount: transferAmountLabel })}</p>
          <p>
            {t("manualTransferCompanyLabel")} {t("manualTransferCompanyName")}
          </p>
          <p>
            {t("manualTransferBankLabel")} {t("manualTransferBankName")}
          </p>
          <p>
            {t("manualTransferAccountLabel")}{" "}
            <span dir="ltr" className="inline-block">
              {t("manualTransferAccountNumber")}
            </span>
          </p>
          <p>
            {t("manualTransferIbanLabel")}{" "}
            <span dir="ltr" className="inline-block">
              {t("manualTransferIban")}
            </span>
          </p>
          <p className="pt-1">{t("manualTransferReferenceNote")}</p>
        </div>
        {appliedCoupon?.valid && (
          <p className="mt-3 rounded-md border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            {t("manualTransferDiscountApplied", { amount: transferAmountLabel })}
          </p>
        )}
      </div>

      {showPending && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/40">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            {t("manualTransferPendingTitle")}
          </p>
          <p className="mt-1 text-amber-700/90 dark:text-amber-400">
            {t("manualTransferPendingMessage")}
          </p>
        </div>
      )}

      {!canManage && (
        <p className="text-sm text-muted-foreground">{t("readOnlyHint")}</p>
      )}

      {canManage && !showPending && (
        <>
          <div className="space-y-2">
            <label htmlFor="manual-transfer-proof" className="text-sm font-medium">
              {t("manualTransferProofLabel")}
            </label>
            <input
              ref={fileInputRef}
              id="manual-transfer-proof"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              disabled={submitting}
              className="block w-full text-sm text-muted-foreground file:me-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">{t("manualTransferFileHint")}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="button"
            variant="secondary"
            disabled={submitting || !file}
            onClick={() => void handleSubmit()}
          >
            {submitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("manualTransferSubmitting")}
              </>
            ) : (
              <>
                <Upload className="me-2 h-4 w-4" />
                {t("manualTransferSubmit")}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-4 border-t border-border/80 pt-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">{t("manualTransferTitle")}</p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          {t("manualTransferTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
