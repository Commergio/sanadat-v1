export {
  buildCouponPlatformApp,
  buildCouponBillingApp,
} from "./factory";
export { buildCouponUseCases, toValidateCouponResponse } from "./use-cases";
export { normalizeCouponCode, validateCouponForCheckout } from "./calculate-discount";
export type {
  CouponListQuery,
  CouponListResult,
  CouponValidationResult,
  DiscountCouponModel,
  DiscountCouponType,
  ValidateCouponInput,
} from "./types";
export type { CouponRepositoryPort } from "./repository-ports";
