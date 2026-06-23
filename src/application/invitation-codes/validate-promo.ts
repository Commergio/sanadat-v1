import type { InvitationPromoCodeModel, InvitationValidationResult } from "./types";

export function normalizeInvitationCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateInvitationPromoForRedemption(input: {
  promo: InvitationPromoCodeModel;
  totalRedemptionCount: number;
  companyRedemptionCount: number;
  now?: Date;
}): InvitationValidationResult {
  const now = input.now ?? new Date();
  const code = input.promo.code;

  if (!input.promo.active) {
    return { valid: false, code, message: "This invitation code is not active" };
  }

  if (input.promo.startsAt) {
    const starts = new Date(input.promo.startsAt).getTime();
    if (!Number.isNaN(starts) && starts > now.getTime()) {
      return { valid: false, code, message: "This invitation code is not yet valid" };
    }
  }

  if (input.promo.expiresAt) {
    const expires = new Date(input.promo.expiresAt).getTime();
    if (!Number.isNaN(expires) && expires < now.getTime()) {
      return { valid: false, code, message: "This invitation code has expired" };
    }
  }

  if (
    input.promo.maxRedemptions != null &&
    input.totalRedemptionCount >= input.promo.maxRedemptions
  ) {
    return {
      valid: false,
      code,
      message: "This invitation code has reached its redemption limit",
    };
  }

  if (input.companyRedemptionCount >= input.promo.perCompanyLimit) {
    return {
      valid: false,
      code,
      message: "This company has already used this invitation code",
    };
  }

  return { valid: true, promo: input.promo };
}
