import type { CouponListQuery, CouponListResult, DiscountCouponModel } from "./types";

export interface CouponRepositoryPort {
  listAll(query: CouponListQuery): Promise<CouponListResult>;
  getById(id: string): Promise<DiscountCouponModel | null>;
  getByCode(code: string): Promise<DiscountCouponModel | null>;
  create(input: Record<string, unknown>, adminUserId: string): Promise<DiscountCouponModel>;
  update(
    id: string,
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<DiscountCouponModel>;
  delete(id: string): Promise<void>;
  logAdminAction(
    action: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  countActiveRedemptions(couponId: string): Promise<number>;
  countCompanyActiveRedemptions(couponId: string, companyId: string): Promise<number>;
  createRedemption(input: {
    couponId: string;
    companyId: string;
    paymentId: string;
    subscriptionId: string | null;
    redeemedBy: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  }): Promise<string>;
}
