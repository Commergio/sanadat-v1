import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InvitationCodeListQuery,
  InvitationCodeListResult,
  InvitationPromoCodeModel,
  InvitationPromoRedemptionModel,
} from "@/application/invitation-codes/types";
import type { InvitationCodeRepositoryPort } from "@/application/invitation-codes/repository-ports";
import { normalizeInvitationCode } from "@/application/invitation-codes/validate-promo";
import { RepositoryError } from "@/application/shared/errors";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

function mapPromoRow(row: Row): InvitationPromoCodeModel {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    durationDays: Number(row.duration_days),
    maxRedemptions: row.max_redemptions != null ? Number(row.max_redemptions) : null,
    perCompanyLimit: Number(row.per_company_limit ?? 1),
    startsAt: row.starts_at ? String(row.starts_at) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    active: Boolean(row.active),
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapRedemptionRow(row: Row): InvitationPromoRedemptionModel {
  const promo = row.invitation_promo_codes as { code?: string; name?: string } | null;
  return {
    id: String(row.id),
    promoCodeId: String(row.promo_code_id),
    promoCode: promo?.code ?? null,
    promoName: promo?.name ?? null,
    companyId: String(row.company_id),
    redeemedBy: String(row.redeemed_by),
    subscriptionId: (row.subscription_id as string | null) ?? null,
    grantedDays: Number(row.granted_days),
    startsAt: String(row.starts_at),
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
  };
}

function buildInsertPayload(
  input: Record<string, unknown>,
  adminUserId: string
): Record<string, unknown> {
  return {
    code: normalizeInvitationCode(String(input.code)),
    name: input.name,
    description: input.description ?? null,
    duration_days: input.duration_days,
    max_redemptions: input.max_redemptions ?? null,
    per_company_limit: input.per_company_limit ?? 1,
    starts_at: input.starts_at ?? null,
    expires_at: input.expires_at ?? null,
    active: input.active ?? true,
    created_by: adminUserId,
    updated_by: adminUserId,
  };
}

function buildUpdatePayload(
  input: Record<string, unknown>,
  adminUserId: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = { updated_by: adminUserId };
  if (input.code !== undefined) payload.code = normalizeInvitationCode(String(input.code));
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.duration_days !== undefined) payload.duration_days = input.duration_days;
  if (input.max_redemptions !== undefined) payload.max_redemptions = input.max_redemptions;
  if (input.per_company_limit !== undefined) payload.per_company_limit = input.per_company_limit;
  if (input.starts_at !== undefined) payload.starts_at = input.starts_at;
  if (input.expires_at !== undefined) payload.expires_at = input.expires_at;
  if (input.active !== undefined) payload.active = input.active;
  return payload;
}

export class InvitationCodeRepository implements InvitationCodeRepositoryPort {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient
  ) {}

  async listAll(query: InvitationCodeListQuery): Promise<InvitationCodeListResult> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.readClient
      .from("invitation_promo_codes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.search) {
      const term = query.search.trim();
      builder = builder.or(`code.ilike.%${term}%,name.ilike.%${term}%`);
    }

    if (query.active !== undefined) {
      builder = builder.eq("active", query.active);
    }

    const { data, error, count } = await builder;
    if (error) throw toRepositoryError(error, "Failed to list invitation codes");

    const items = ((data ?? []) as Row[]).map(mapPromoRow);
    const counts = await this.loadRedemptionCounts(items.map((item) => item.id));

    return {
      items: items.map((item) => ({
        ...item,
        redemptionCount: counts.get(item.id) ?? 0,
      })),
      total: count ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }

  private async loadRedemptionCounts(promoIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (promoIds.length === 0) return map;

    const { data, error } = await this.readClient
      .from("invitation_promo_redemptions")
      .select("promo_code_id")
      .in("promo_code_id", promoIds);

    if (error) {
      throw toRepositoryError(error, "Failed to load invitation code usage counts");
    }

    for (const row of (data ?? []) as Row[]) {
      const promoId = String(row.promo_code_id);
      map.set(promoId, (map.get(promoId) ?? 0) + 1);
    }

    return map;
  }

  async getById(id: string): Promise<InvitationPromoCodeModel | null> {
    const { data, error } = await this.readClient
      .from("invitation_promo_codes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load invitation code");
    if (!data) return null;
    return mapPromoRow(data as Row);
  }

  async getByCode(code: string): Promise<InvitationPromoCodeModel | null> {
    const normalized = normalizeInvitationCode(code);
    const { data, error } = await this.writeClient
      .from("invitation_promo_codes")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load invitation code by code");
    if (!data) return null;
    return mapPromoRow(data as Row);
  }

  async create(
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<InvitationPromoCodeModel> {
    const { data, error } = await this.writeClient
      .from("invitation_promo_codes")
      .insert(buildInsertPayload(input, adminUserId))
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError("VALIDATION", "Invitation code already exists", error);
      }
      throw toRepositoryError(error, "Failed to create invitation code");
    }

    return mapPromoRow(data as Row);
  }

  async update(
    id: string,
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<InvitationPromoCodeModel> {
    const { data, error } = await this.writeClient
      .from("invitation_promo_codes")
      .update(buildUpdatePayload(input, adminUserId))
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError("VALIDATION", "Invitation code already exists", error);
      }
      throw toRepositoryError(error, "Failed to update invitation code");
    }
    if (!data) {
      throw new RepositoryError("NOT_FOUND", "Invitation code not found");
    }

    return mapPromoRow(data as Row);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.writeClient
      .from("invitation_promo_codes")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23503") {
        throw new RepositoryError(
          "VALIDATION",
          "Cannot delete invitation code with existing redemptions",
          error
        );
      }
      throw toRepositoryError(error, "Failed to delete invitation code");
    }
    if (!data) {
      throw new RepositoryError("NOT_FOUND", "Invitation code not found");
    }
  }

  async logAdminAction(
    action: string,
    entityId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const { error } = await this.writeClient.rpc("platform_log_admin_action", {
      p_action: action,
      p_entity_type: "invitation_code",
      p_entity_id: entityId,
      p_metadata: metadata,
    });

    if (error) {
      throw toRepositoryError(error, "Failed to log platform admin action");
    }
  }

  async countRedemptions(promoCodeId: string): Promise<number> {
    const { count, error } = await this.writeClient
      .from("invitation_promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promoCodeId);

    if (error) throw toRepositoryError(error, "Failed to count invitation redemptions");
    return count ?? 0;
  }

  async countCompanyRedemptions(promoCodeId: string, companyId: string): Promise<number> {
    const { count, error } = await this.writeClient
      .from("invitation_promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promoCodeId)
      .eq("company_id", companyId);

    if (error) {
      throw toRepositoryError(error, "Failed to count company invitation redemptions");
    }
    return count ?? 0;
  }

  async createRedemption(input: {
    promoCodeId: string;
    companyId: string;
    redeemedBy: string;
    subscriptionId: string | null;
    grantedDays: number;
    startsAt: string;
    expiresAt: string;
  }): Promise<string> {
    const { data, error } = await this.writeClient
      .from("invitation_promo_redemptions")
      .insert({
        promo_code_id: input.promoCodeId,
        company_id: input.companyId,
        redeemed_by: input.redeemedBy,
        subscription_id: input.subscriptionId,
        granted_days: input.grantedDays,
        starts_at: input.startsAt,
        expires_at: input.expiresAt,
      })
      .select("id")
      .single();

    if (error) {
      throw new RepositoryError(
        "VALIDATION",
        error.message || "Failed to create invitation redemption",
        error
      );
    }

    return String(data.id);
  }

  async listRedemptionsByCompany(companyId: string): Promise<InvitationPromoRedemptionModel[]> {
    const { data, error } = await this.readClient
      .from("invitation_promo_redemptions")
      .select("*, invitation_promo_codes(code, name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw toRepositoryError(error, "Failed to list invitation redemptions");
    return ((data ?? []) as Row[]).map(mapRedemptionRow);
  }
}
