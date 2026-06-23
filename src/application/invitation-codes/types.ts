export interface InvitationPromoCodeModel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationDays: number;
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

export interface InvitationCodeListResult {
  items: InvitationPromoCodeModel[];
  total: number;
  page: number;
  limit: number;
}

export interface InvitationCodeListQuery {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}

export interface InvitationPromoRedemptionModel {
  id: string;
  promoCodeId: string;
  promoCode: string | null;
  promoName: string | null;
  companyId: string;
  redeemedBy: string;
  subscriptionId: string | null;
  grantedDays: number;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface ApplyInvitationCodeResult {
  success: true;
  code: string;
  grantedDays: number;
  startsAt: string;
  expiresAt: string;
  subscriptionStatus: string;
  subscriptionSource: string;
}

export interface InvitationValidationFailure {
  valid: false;
  code: string;
  message: string;
}

export interface InvitationValidationSuccess {
  valid: true;
  promo: InvitationPromoCodeModel;
}

export type InvitationValidationResult =
  | InvitationValidationSuccess
  | InvitationValidationFailure;
