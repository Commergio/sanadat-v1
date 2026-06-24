"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { CouponValidateResponse } from "@/hooks/use-coupons";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

interface SubscriptionCouponFieldsProps {
  locale: string;
  couponInput: string;
  setCouponInput: (value: string) => void;
  appliedCoupon: CouponValidateResponse | null;
  couponLoading: boolean;
  couponError: string | null;
  onApply: () => void | Promise<void>;
  onClear: () => void;
  disabled?: boolean;
  inputId?: string;
}

export function SubscriptionCouponFields({
  locale,
  couponInput,
  setCouponInput,
  appliedCoupon,
  couponLoading,
  couponError,
  onApply,
  onClear,
  disabled = false,
  inputId = "coupon-code",
}: SubscriptionCouponFieldsProps) {
  const t = useTranslations("subscription");

  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
      <p className="font-medium text-foreground">{t("couponSectionTitle")}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor={inputId} className="text-xs text-muted-foreground">
            {t("couponCodeLabel")}
          </label>
          <input
            id={inputId}
            dir="ltr"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm uppercase"
            value={couponInput}
            disabled={disabled || couponLoading}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder={t("couponCodePlaceholder")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || couponLoading || !couponInput.trim()}
            onClick={() => void onApply()}
          >
            {couponLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("couponApplying")}
              </>
            ) : (
              t("couponApply")
            )}
          </Button>
          {appliedCoupon?.valid && (
            <Button type="button" variant="outline" disabled={disabled || couponLoading} onClick={onClear}>
              {t("couponClear")}
            </Button>
          )}
        </div>
      </div>

      {couponError && <p className="text-sm text-destructive">{couponError}</p>}

      {appliedCoupon?.valid && (
        <div className="grid gap-2 rounded-md border border-emerald-200/70 bg-emerald-50/80 p-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:grid-cols-3">
          <DetailRow
            label={t("couponOriginalAmount")}
            value={formatCurrency(appliedCoupon.original_amount ?? 0, locale)}
          />
          <DetailRow
            label={t("couponDiscountAmount")}
            value={formatCurrency(appliedCoupon.discount_amount ?? 0, locale)}
          />
          <DetailRow
            label={t("couponFinalAmount")}
            value={formatCurrency(appliedCoupon.final_amount ?? 0, locale)}
          />
        </div>
      )}
    </div>
  );
}
