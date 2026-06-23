import type {
  InvitationCodeListQuery,
  InvitationCodeListResult,
  InvitationPromoCodeModel,
  InvitationPromoRedemptionModel,
} from "./types";

export interface InvitationCodeRepositoryPort {
  listAll(query: InvitationCodeListQuery): Promise<InvitationCodeListResult>;
  getById(id: string): Promise<InvitationPromoCodeModel | null>;
  getByCode(code: string): Promise<InvitationPromoCodeModel | null>;
  create(input: Record<string, unknown>, adminUserId: string): Promise<InvitationPromoCodeModel>;
  update(
    id: string,
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<InvitationPromoCodeModel>;
  delete(id: string): Promise<void>;
  logAdminAction(
    action: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  countRedemptions(promoCodeId: string): Promise<number>;
  countCompanyRedemptions(promoCodeId: string, companyId: string): Promise<number>;
  createRedemption(input: {
    promoCodeId: string;
    companyId: string;
    redeemedBy: string;
    subscriptionId: string | null;
    grantedDays: number;
    startsAt: string;
    expiresAt: string;
  }): Promise<string>;
  listRedemptionsByCompany(companyId: string): Promise<InvitationPromoRedemptionModel[]>;
}
