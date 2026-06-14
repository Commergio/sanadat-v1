export type DiscountCouponType = "percentage" | "fixed_amount";

export interface DiscountCouponModel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: DiscountCouponType;
  discountValue: number;
  currency: string;
  maxRedemptions: number | null;
  perCompanyLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  redemptionCount?: number;
}

export interface CouponListResult {
  items: DiscountCouponModel[];
  total: number;
  page: number;
  limit: number;
}

export interface CouponListQuery {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}

export interface CouponDiscountBreakdown {
  valid: true;
  couponId: string;
  couponCode: string;
  discountType: DiscountCouponType;
  discountValue: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  message: string;
}

export interface CouponValidationFailure {
  valid: false;
  message: string;
}

export type CouponValidationResult = CouponDiscountBreakdown | CouponValidationFailure;

export interface ValidateCouponInput {
  code: string;
  planCode: string;
  billingCycle: "yearly";
}
