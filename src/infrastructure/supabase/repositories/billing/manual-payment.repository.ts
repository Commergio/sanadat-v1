import type { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "@/application/shared/errors";
import type { ManualPaymentRepositoryPort } from "@/application/billing/manual-payment-repository-ports";
import type {
  ManualPaymentRequestModel,
  ManualPaymentStatus,
} from "@/application/billing/manual-payment-types";
import type { TenantContext } from "@/lib/tenant";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

function mapRequest(row: Row, companyName?: string | null): ManualPaymentRequestModel {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyName: companyName ?? (row.company_name as string | null) ?? null,
    subscriptionId: (row.subscription_id as string | null) ?? null,
    requestedBy: String(row.requested_by),
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    planCode: String(row.plan_code),
    billingCycle: (row.billing_cycle as "yearly") ?? "yearly",
    status: row.status as ManualPaymentStatus,
    adminNote: (row.admin_note as string | null) ?? null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class ManualPaymentRepository implements ManualPaymentRepositoryPort {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient
  ) {}

  async findPendingByCompanyId(companyId: string): Promise<ManualPaymentRequestModel | null> {
    const { data, error } = await this.readClient
      .from("manual_payment_requests")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load pending manual payment");
    if (!data) return null;
    return mapRequest(data as Row);
  }

  async createRequest(
    ctx: TenantContext,
    input: {
      id: string;
      subscriptionId: string | null;
      amount: number;
      currency: string;
      planCode: string;
      billingCycle: "yearly";
      proofFilePath: string;
    }
  ): Promise<ManualPaymentRequestModel> {
    const { data, error } = await this.writeClient
      .from("manual_payment_requests")
      .insert({
        id: input.id,
        company_id: ctx.companyId,
        subscription_id: input.subscriptionId,
        requested_by: ctx.userId,
        amount: input.amount,
        currency: input.currency,
        plan_code: input.planCode,
        billing_cycle: input.billingCycle,
        proof_file_path: input.proofFilePath,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError(
          "CONFLICT",
          "A pending bank transfer request already exists for this company",
          error
        );
      }
      throw new RepositoryError("VALIDATION", error.message || "Failed to create manual payment request", error);
    }

    return mapRequest(data as Row);
  }

  async listForPlatform(input: {
    status?: ManualPaymentStatus;
    limit: number;
    offset: number;
  }): Promise<{ items: ManualPaymentRequestModel[]; total: number }> {
    let query = this.readClient
      .from("manual_payment_requests")
      .select("*, companies(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.status) {
      query = query.eq("status", input.status);
    }

    const { data, error, count } = await query;
    if (error) throw toRepositoryError(error, "Failed to list manual payment requests");

    const items = ((data ?? []) as Row[]).map((row) => {
      const companies = row.companies as { name?: string } | null;
      return mapRequest(row, companies?.name ?? null);
    });

    return { items, total: count ?? items.length };
  }

  async getByIdForPlatform(
    id: string
  ): Promise<(ManualPaymentRequestModel & { proofFilePath: string }) | null> {
    const { data, error } = await this.readClient
      .from("manual_payment_requests")
      .select("*, companies(name)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load manual payment request");
    if (!data) return null;

    const row = data as Row;
    const companies = row.companies as { name?: string } | null;
    return {
      ...mapRequest(row, companies?.name ?? null),
      proofFilePath: String(row.proof_file_path),
    };
  }

  async getByIdForTenant(ctx: TenantContext, id: string): Promise<ManualPaymentRequestModel | null> {
    const { data, error } = await this.readClient
      .from("manual_payment_requests")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load manual payment request");
    if (!data) return null;
    return mapRequest(data as Row);
  }

  async markApprovedViaRpc(
    requestId: string,
    paymentId: string,
    adminNote?: string | null
  ): Promise<void> {
    const { error } = await this.writeClient.rpc("platform_approve_manual_payment", {
      p_request_id: requestId,
      p_payment_id: paymentId,
      p_admin_note: adminNote ?? null,
    });

    if (error) {
      throw new RepositoryError("VALIDATION", error.message || "Failed to approve manual payment", error);
    }
  }

  async markRejectedViaRpc(requestId: string, adminNote: string): Promise<void> {
    const { error } = await this.writeClient.rpc("platform_reject_manual_payment", {
      p_request_id: requestId,
      p_admin_note: adminNote,
    });

    if (error) {
      throw new RepositoryError("VALIDATION", error.message || "Failed to reject manual payment", error);
    }
  }
}
