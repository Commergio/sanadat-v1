import type {
  CouponDiscountBreakdown,
  CouponValidationFailure,
  CouponValidationResult,
  DiscountCouponModel,
  DiscountCouponType,
} from "./types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function calculateDiscountAmount(
  originalAmount: number,
  discountType: DiscountCouponType,
  discountValue: number,
  currency: string
): { discountAmount: number; finalAmount: number } {
  let discountAmount = 0;

  if (discountType === "percentage") {
    discountAmount = roundMoney((originalAmount * discountValue) / 100);
  } else {
    discountAmount = roundMoney(Math.min(discountValue, originalAmount));
  }

  const finalAmount = roundMoney(Math.max(originalAmount - discountAmount, 0));
  return { discountAmount, finalAmount };
}

export function validateCouponForCheckout(params: {
  coupon: DiscountCouponModel;
  originalAmount: number;
  currency: string;
  totalRedemptionCount: number;
  companyRedemptionCount: number;
  now?: Date;
}): CouponValidationResult {
  const { coupon, originalAmount, currency, totalRedemptionCount, companyRedemptionCount } =
    params;
  const now = params.now ?? new Date();

  const fail = (message: string): CouponValidationFailure => ({ valid: false, message });

  if (!coupon.active) {
    return fail("Coupon is not active");
  }

  if (coupon.startsAt) {
    const starts = new Date(coupon.startsAt).getTime();
    if (!Number.isNaN(starts) && starts > now.getTime()) {
      return fail("Coupon is not yet valid");
    }
  }

  if (coupon.expiresAt) {
    const expires = new Date(coupon.expiresAt).getTime();
    if (!Number.isNaN(expires) && expires < now.getTime()) {
      return fail("Coupon has expired");
    }
  }

  if (coupon.discountType === "percentage") {
    if (coupon.discountValue <= 0 || coupon.discountValue > 100) {
      return fail("Invalid percentage discount");
    }
  } else if (coupon.discountValue <= 0) {
    return fail("Invalid fixed discount amount");
  }

  if (coupon.currency.toUpperCase() !== currency.toUpperCase()) {
    return fail("Coupon currency does not match plan currency");
  }

  if (coupon.maxRedemptions != null && totalRedemptionCount >= coupon.maxRedemptions) {
    return fail("Coupon redemption limit reached");
  }

  if (companyRedemptionCount >= coupon.perCompanyLimit) {
    return fail("Coupon usage limit reached for this company");
  }

  const { discountAmount, finalAmount } = calculateDiscountAmount(
    originalAmount,
    coupon.discountType,
    coupon.discountValue,
    currency
  );

  if (finalAmount < 0) {
    return fail("Discount would reduce amount below zero");
  }

  const breakdown: CouponDiscountBreakdown = {
    valid: true,
    couponId: coupon.id,
    couponCode: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    originalAmount: roundMoney(originalAmount),
    discountAmount,
    finalAmount,
    currency: currency.toUpperCase(),
    message: "Coupon applied successfully",
  };

  return breakdown;
}
