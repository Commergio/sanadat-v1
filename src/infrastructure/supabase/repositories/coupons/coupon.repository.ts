import type { SupabaseClient } from "@supabase/supabase-js";
import type { CouponListQuery, CouponListResult, DiscountCouponModel } from "@/application/coupons/types";
import type { CouponRepositoryPort } from "@/application/coupons/repository-ports";
import { normalizeCouponCode } from "@/application/coupons/calculate-discount";
import { RepositoryError } from "@/application/shared/errors";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

function mapCouponRow(row: Row): DiscountCouponModel {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    discountType: row.discount_type as DiscountCouponModel["discountType"],
    discountValue: Number(row.discount_value),
    currency: String(row.currency ?? "SAR"),
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

function buildInsertPayload(
  input: Record<string, unknown>,
  adminUserId: string
): Record<string, unknown> {
  return {
    code: normalizeCouponCode(String(input.code)),
    name: input.name,
    description: input.description ?? null,
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    currency: (input.currency as string | undefined)?.toUpperCase() ?? "SAR",
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
  if (input.code !== undefined) payload.code = normalizeCouponCode(String(input.code));
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.discount_type !== undefined) payload.discount_type = input.discount_type;
  if (input.discount_value !== undefined) payload.discount_value = input.discount_value;
  if (input.currency !== undefined) payload.currency = String(input.currency).toUpperCase();
  if (input.max_redemptions !== undefined) payload.max_redemptions = input.max_redemptions;
  if (input.per_company_limit !== undefined) payload.per_company_limit = input.per_company_limit;
  if (input.starts_at !== undefined) payload.starts_at = input.starts_at;
  if (input.expires_at !== undefined) payload.expires_at = input.expires_at;
  if (input.active !== undefined) payload.active = input.active;
  return payload;
}

export class CouponRepository implements CouponRepositoryPort {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient
  ) {}

  async listAll(query: CouponListQuery): Promise<CouponListResult> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.readClient
      .from("discount_coupons")
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
    if (error) throw toRepositoryError(error, "Failed to list coupons");

    const items = ((data ?? []) as Row[]).map(mapCouponRow);
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

  private async loadRedemptionCounts(couponIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (couponIds.length === 0) return map;

    const { data, error } = await this.readClient
      .from("discount_coupon_redemptions")
      .select("coupon_id, payments!inner(status)")
      .in("coupon_id", couponIds)
      .in("payments.status", ["pending", "completed"]);

    if (error) {
      throw toRepositoryError(error, "Failed to load coupon usage counts");
    }

    for (const row of (data ?? []) as Row[]) {
      const couponId = String(row.coupon_id);
      map.set(couponId, (map.get(couponId) ?? 0) + 1);
    }

    return map;
  }

  async getById(id: string): Promise<DiscountCouponModel | null> {
    const { data, error } = await this.readClient
      .from("discount_coupons")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load coupon");
    if (!data) return null;
    return mapCouponRow(data as Row);
  }

  async getByCode(code: string): Promise<DiscountCouponModel | null> {
    const normalized = normalizeCouponCode(code);
    const { data, error } = await this.writeClient
      .from("discount_coupons")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load coupon by code");
    if (!data) return null;
    return mapCouponRow(data as Row);
  }

  async create(
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<DiscountCouponModel> {
    const { data, error } = await this.writeClient
      .from("discount_coupons")
      .insert(buildInsertPayload(input, adminUserId))
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError("VALIDATION", "Coupon code already exists", error);
      }
      throw toRepositoryError(error, "Failed to create coupon");
    }

    return mapCouponRow(data as Row);
  }

  async update(
    id: string,
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<DiscountCouponModel> {
    const { data, error } = await this.writeClient
      .from("discount_coupons")
      .update(buildUpdatePayload(input, adminUserId))
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError("VALIDATION", "Coupon code already exists", error);
      }
      throw toRepositoryError(error, "Failed to update coupon");
    }
    if (!data) {
      throw new RepositoryError("NOT_FOUND", "Coupon not found");
    }

    return mapCouponRow(data as Row);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.writeClient
      .from("discount_coupons")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23503") {
        throw new RepositoryError(
          "VALIDATION",
          "Cannot delete coupon with existing redemptions",
          error
        );
      }
      throw toRepositoryError(error, "Failed to delete coupon");
    }
    if (!data) {
      throw new RepositoryError("NOT_FOUND", "Coupon not found");
    }
  }

  async logAdminAction(
    action: string,
    entityId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const { error } = await this.writeClient.rpc("platform_log_admin_action", {
      p_action: action,
      p_entity_type: "coupon",
      p_entity_id: entityId,
      p_metadata: metadata,
    });

    if (error) {
      throw toRepositoryError(error, "Failed to log platform admin action");
    }
  }

  async countActiveRedemptions(couponId: string): Promise<number> {
    const { count, error } = await this.writeClient
      .from("discount_coupon_redemptions")
      .select("id, payments!inner(status)", { count: "exact", head: true })
      .eq("coupon_id", couponId)
      .in("payments.status", ["pending", "completed"]);

    if (error) throw toRepositoryError(error, "Failed to count coupon redemptions");
    return count ?? 0;
  }

  async countCompanyActiveRedemptions(couponId: string, companyId: string): Promise<number> {
    const { count, error } = await this.writeClient
      .from("discount_coupon_redemptions")
      .select("id, payments!inner(status)", { count: "exact", head: true })
      .eq("coupon_id", couponId)
      .eq("company_id", companyId)
      .in("payments.status", ["pending", "completed"]);

    if (error) {
      throw toRepositoryError(error, "Failed to count company coupon redemptions");
    }
    return count ?? 0;
  }

  async createRedemption(input: {
    couponId: string;
    companyId: string;
    paymentId: string;
    subscriptionId: string | null;
    redeemedBy: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  }): Promise<string> {
    const { data, error } = await this.writeClient
      .from("discount_coupon_redemptions")
      .insert({
        coupon_id: input.couponId,
        company_id: input.companyId,
        payment_id: input.paymentId,
        subscription_id: input.subscriptionId,
        redeemed_by: input.redeemedBy,
        original_amount: input.originalAmount,
        discount_amount: input.discountAmount,
        final_amount: input.finalAmount,
      })
      .select("id")
      .single();

    if (error) {
      throw new RepositoryError(
        "VALIDATION",
        error.message || "Failed to create coupon redemption",
        error
      );
    }

    return String(data.id);
  }
}
