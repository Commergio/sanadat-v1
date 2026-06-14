import type { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "@/application/shared/errors";
import type {
  BillingGateway,
  BillingRepositoryPort,
  PaymentModel,
  PaymentWebhookRecord,
  StartCheckoutResult,
  SubscriptionModel,
} from "@/application/billing";
import type { PaymentGateway } from "@/lib/types";
import type { TenantContext } from "@/lib/tenant";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

function mapDbGateway(gateway: BillingGateway): PaymentGateway {
  if (gateway === "stcpay") return "stc_pay";
  return gateway;
}

function mapSubscription(row: Row): SubscriptionModel {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    status: row.status as SubscriptionModel["status"],
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    planCode: String(row.plan_code ?? "sanadat_annual"),
    billingCycle: (row.billing_cycle as SubscriptionModel["billingCycle"]) ?? "yearly",
    startsAt: String(row.starts_at),
    expiresAt: String(row.expires_at),
    nextRenewalAt: (row.next_renewal_at as string | null) ?? null,
    autoRenew: Boolean(row.auto_renew),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end ?? false),
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPaymentWebhook(row: Row): PaymentWebhookRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    subscriptionId: (row.subscription_id as string | null) ?? null,
    gateway: String(row.gateway),
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    status: String(row.status),
    gatewayReference: (row.gateway_reference as string | null) ?? null,
    providerEventId: (row.provider_event_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

function mapPayment(row: Row): PaymentModel {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    subscriptionId: (row.subscription_id as string | null) ?? null,
    gateway: row.gateway as PaymentModel["gateway"],
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    status: row.status as PaymentModel["status"],
    gatewayReference: (row.gateway_reference as string | null) ?? null,
    checkoutSessionId: (row.checkout_session_id as string | null) ?? null,
    paymentIntentId: (row.payment_intent_id as string | null) ?? null,
    paidAt: (row.paid_at as string | null) ?? null,
    failedAt: (row.failed_at as string | null) ?? null,
    periodStart: (row.period_start as string | null) ?? null,
    periodEnd: (row.period_end as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class BillingRepository implements BillingRepositoryPort {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient
  ) {}

  async getSubscription(ctx: TenantContext): Promise<SubscriptionModel | null> {
    const { data, error } = await this.readClient
      .from("subscriptions")
      .select(
        "id, company_id, status, amount, currency, plan_code, billing_cycle, starts_at, expires_at, next_renewal_at, auto_renew, cancel_at_period_end, cancelled_at, created_at, updated_at"
      )
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load subscription");
    if (!data) return null;
    return mapSubscription(data as Row);
  }

  async listPayments(ctx: TenantContext): Promise<PaymentModel[]> {
    const { data, error } = await this.readClient
      .from("payments")
      .select(
        "id, company_id, subscription_id, gateway, amount, currency, status, gateway_reference, checkout_session_id, payment_intent_id, paid_at, failed_at, period_start, period_end, created_at, updated_at"
      )
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false });

    if (error) throw toRepositoryError(error, "Failed to list payments");
    return ((data ?? []) as Row[]).map(mapPayment);
  }

  async createPendingPayment(
    ctx: TenantContext,
    input: {
      subscriptionId: string | null;
      gateway: BillingGateway;
      amount: number;
      currency: string;
      planCode: string;
      billingCycle: "yearly";
    }
  ): Promise<string> {
    const { data, error } = await this.writeClient
      .from("payments")
      .insert({
        company_id: ctx.companyId,
        subscription_id: input.subscriptionId,
        gateway: mapDbGateway(input.gateway),
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        metadata: {
          plan_code: input.planCode,
          billing_cycle: input.billingCycle,
          initiated_by: ctx.userId,
          checkout_gateway: input.gateway,
        },
      })
      .select("id")
      .single();

    if (error) {
      throw new RepositoryError(
        "VALIDATION",
        error.message || "Failed to create pending payment",
        error
      );
    }

    return String(data.id);
  }

  async attachCheckoutSession(
    companyId: string,
    paymentId: string,
    session: {
      checkoutSessionId: string;
      gatewayReference: string;
      checkoutUrl: string;
      gateway: BillingGateway;
    }
  ): Promise<void> {
    const { data, error } = await this.writeClient
      .from("payments")
      .update({
        checkout_session_id: session.checkoutSessionId,
        gateway_reference: session.gatewayReference,
        gateway_response: {
          mock_checkout_url: session.checkoutUrl,
          adapter: session.gateway === "manual" ? "manual" : "manual_stub",
          requested_gateway: session.gateway,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("company_id", companyId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      throw new RepositoryError(
        "VALIDATION",
        error.message || "Failed to attach checkout session",
        error
      );
    }
    if (!data) {
      throw new RepositoryError(
        "NOT_FOUND",
        "Pending payment not found for checkout session attach"
      );
    }
  }

  async findPaymentByProviderEventId(
    gateway: PaymentGateway,
    providerEventId: string
  ) {
    const { data, error } = await this.writeClient
      .from("payments")
      .select(
        "id, company_id, subscription_id, gateway, amount, currency, status, gateway_reference, provider_event_id, metadata"
      )
      .eq("gateway", gateway)
      .eq("provider_event_id", providerEventId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to lookup payment by event id");
    if (!data) return null;
    return mapPaymentWebhook(data as Row);
  }

  async findPaymentByGatewayReference(gateway: PaymentGateway, gatewayReference: string) {
    const { data, error } = await this.writeClient
      .from("payments")
      .select(
        "id, company_id, subscription_id, gateway, amount, currency, status, gateway_reference, provider_event_id, metadata"
      )
      .eq("gateway", gateway)
      .eq("gateway_reference", gatewayReference)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to lookup payment by reference");
    if (!data) return null;
    return mapPaymentWebhook(data as Row);
  }

  async findPendingCheckoutPayment(
    ctx: TenantContext,
    input: {
      gateway: BillingGateway;
      amount: number;
      currency: string;
      planCode: string;
    }
  ): Promise<
    | { kind: "reuse"; result: StartCheckoutResult }
    | { kind: "blocked" }
    | null
  > {
    const { data, error } = await this.readClient
      .from("payments")
      .select(
        "id, amount, currency, gateway, gateway_reference, checkout_session_id, gateway_response, metadata"
      )
      .eq("company_id", ctx.companyId)
      .eq("status", "pending")
      .eq("gateway", mapDbGateway(input.gateway))
      .eq("amount", input.amount)
      .eq("currency", input.currency)
      .eq("metadata->>plan_code", input.planCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to lookup pending checkout payment");
    if (!data) return null;

    const row = data as Row;
    const gatewayResponse = (row.gateway_response as Record<string, unknown> | null) ?? {};
    const checkoutUrl =
      typeof gatewayResponse.mock_checkout_url === "string"
        ? gatewayResponse.mock_checkout_url
        : "";

    const checkoutSessionId = (row.checkout_session_id as string | null) ?? "";
    const gatewayReference = (row.gateway_reference as string | null) ?? "";

    if (!checkoutUrl || !checkoutSessionId || !gatewayReference) {
      return { kind: "blocked" };
    }

    return {
      kind: "reuse",
      result: {
        paymentId: String(row.id),
        checkoutUrl,
        checkoutSessionId,
        gatewayReference,
        amount: Number(row.amount),
        currency: String(row.currency ?? input.currency),
        planCode: input.planCode,
        billingCycle: "yearly",
        gateway: input.gateway,
        reusedPending: true,
      },
    };
  }

  async completePaymentWebhook(input: {
    paymentId: string;
    companyId: string;
    providerEventId: string;
    paidAt: string;
    periodStart: string;
    periodEnd: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<void> {
    const { data, error } = await this.writeClient
      .from("payments")
      .update({
        status: "completed",
        provider_event_id: input.providerEventId,
        paid_at: input.paidAt,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        gateway_response: input.rawPayload ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.paymentId)
      .eq("company_id", input.companyId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError("ALREADY_PROCESSED", "Provider event already processed", error);
      }
      throw new RepositoryError("VALIDATION", error.message || "Failed to complete payment", error);
    }
    if (!data) {
      throw new RepositoryError(
        "ALREADY_PROCESSED",
        "Payment is not pending or was already processed"
      );
    }
  }

  async failPaymentWebhook(input: {
    paymentId: string;
    companyId: string;
    providerEventId: string;
    failedAt: string;
    failureCode?: string;
    failureReason?: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<void> {
    const { data, error } = await this.writeClient
      .from("payments")
      .update({
        status: "failed",
        provider_event_id: input.providerEventId,
        failed_at: input.failedAt,
        failure_code: input.failureCode ?? null,
        failure_reason: input.failureReason ?? null,
        gateway_response: input.rawPayload ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.paymentId)
      .eq("company_id", input.companyId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        throw new RepositoryError("ALREADY_PROCESSED", "Provider event already processed", error);
      }
      throw new RepositoryError("VALIDATION", error.message || "Failed to mark payment failed", error);
    }
    if (!data) {
      throw new RepositoryError(
        "ALREADY_PROCESSED",
        "Payment is not pending or was already processed"
      );
    }
  }

  async activateOrExtendSubscription(input: {
    subscriptionId: string;
    companyId: string;
    amount: number;
    planCode: string;
    billingCycle: "yearly";
    startsAt: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<void> {
    const { error } = await this.writeClient
      .from("subscriptions")
      .update({
        status: "active",
        amount: input.amount,
        plan_code: input.planCode,
        billing_cycle: input.billingCycle,
        starts_at: input.startsAt,
        expires_at: input.periodEnd,
        next_renewal_at: input.periodEnd,
        auto_renew: true,
        cancel_at_period_end: false,
        cancelled_at: null,
        cancelled_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.subscriptionId)
      .eq("company_id", input.companyId);

    if (error) {
      throw new RepositoryError("VALIDATION", error.message || "Failed to activate subscription", error);
    }
  }

  async getSubscriptionByCompanyId(companyId: string): Promise<SubscriptionModel | null> {
    const { data, error } = await this.writeClient
      .from("subscriptions")
      .select(
        "id, company_id, status, amount, currency, plan_code, billing_cycle, starts_at, expires_at, next_renewal_at, auto_renew, cancel_at_period_end, cancelled_at, created_at, updated_at"
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load subscription");
    if (!data) return null;
    return mapSubscription(data as Row);
  }

  async resolveCompanyOwnerUserId(companyId: string): Promise<string | null> {
    const { data, error } = await this.writeClient
      .from("company_members")
      .select("user_id")
      .eq("company_id", companyId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to resolve company owner");
    return data?.user_id ? String(data.user_id) : null;
  }
}
