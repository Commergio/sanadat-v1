/**
 * P2.4.1 in-process billing QA (no DB). Run: npx tsx scripts/billing-qa.harness.ts
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://qa.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "qa-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "qa-service-role-key";

import { assertCanStartCheckout } from "../src/application/billing/authorization";
import { buildPaymentWebhookHandler } from "../src/application/billing/webhook-use-cases";
import { UseCaseError } from "../src/application/shared/use-case-error";
import type { BillingRepositoryPort } from "../src/application/billing/repository-ports";
import type { PaymentWebhookRecord } from "../src/application/billing/webhook-types";
import type { PaymentModel, SubscriptionModel } from "../src/application/billing/types";

const COMPANY_ID = "company-qa-1";
const SUB_ID = "sub-qa-1";

const OWNER_CTX = {
  userId: "user-owner",
  companyId: COMPANY_ID,
  role: "owner" as const,
};

const ACCOUNTANT_CTX = {
  ...OWNER_CTX,
  userId: "user-acct",
  role: "accountant" as const,
};

function baseSubscription(overrides?: Partial<SubscriptionModel>): SubscriptionModel {
  const now = new Date();
  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return {
    id: SUB_ID,
    companyId: COMPANY_ID,
    status: "trialing",
    amount: 399,
    currency: "SAR",
    planCode: "sanadat_annual",
    billingCycle: "yearly",
    startsAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    nextRenewalAt: null,
    autoRenew: false,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

function createMockRepo() {
  let subscription = baseSubscription();
  const payments = new Map<string, PaymentModel & { metadata: Record<string, unknown> }>();
  const byReference = new Map<string, string>();
  const byEvent = new Map<string, string>();

  const repo: BillingRepositoryPort = {
    async getSubscription(ctx) {
      return ctx.companyId === COMPANY_ID ? { ...subscription } : null;
    },
    async listPayments(ctx) {
      return [...payments.values()]
        .filter((p) => p.companyId === ctx.companyId)
        .map(({ metadata: _m, ...p }) => p);
    },
    async createPendingPayment(ctx, input) {
      const id = `pay-${payments.size + 1}`;
      const row = {
        id,
        companyId: ctx.companyId,
        subscriptionId: input.subscriptionId,
        gateway: "manual" as const,
        amount: input.amount,
        currency: input.currency,
        status: "pending" as const,
        gatewayReference: null,
        checkoutSessionId: null,
        paymentIntentId: null,
        paidAt: null,
        failedAt: null,
        periodStart: null,
        periodEnd: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          plan_code: input.planCode,
          billing_cycle: input.billingCycle,
          initiated_by: ctx.userId,
        },
      };
      payments.set(id, row);
      return id;
    },
    async attachCheckoutSession(companyId, paymentId, session) {
      const p = payments.get(paymentId);
      if (!p || p.status !== "pending") {
        throw new UseCaseError("NOT_FOUND", "Pending payment not found");
      }
      p.gatewayReference = session.gatewayReference;
      p.checkoutSessionId = session.checkoutSessionId;
      byReference.set(session.gatewayReference, paymentId);
    },
    async findPaymentByProviderEventId(gateway, providerEventId) {
      const id = byEvent.get(`${gateway}:${providerEventId}`);
      if (!id) return null;
      return toWebhookRecord(payments.get(id)!);
    },
    async findPaymentByGatewayReference(gateway, gatewayReference) {
      const id = byReference.get(gatewayReference);
      if (!id) return null;
      const p = payments.get(id);
      if (!p || p.gateway !== gateway) return null;
      return toWebhookRecord(p);
    },
    async completePaymentWebhook(input) {
      const p = payments.get(input.paymentId);
      if (!p || p.status !== "pending") {
        throw new UseCaseError("ALREADY_PROCESSED", "not pending");
      }
      p.status = "completed";
      p.paidAt = input.paidAt;
      p.periodStart = input.periodStart;
      p.periodEnd = input.periodEnd;
      byEvent.set(`manual:${input.providerEventId}`, input.paymentId);
    },
    async failPaymentWebhook(input) {
      const p = payments.get(input.paymentId);
      if (!p || p.status !== "pending") {
        throw new UseCaseError("ALREADY_PROCESSED", "not pending");
      }
      p.status = "failed";
      p.failedAt = input.failedAt;
      byEvent.set(`manual:${input.providerEventId}`, input.paymentId);
    },
    async activateOrExtendSubscription(input) {
      subscription = {
        ...subscription,
        status: "active",
        amount: input.amount,
        planCode: input.planCode,
        billingCycle: input.billingCycle,
        startsAt: input.startsAt,
        expiresAt: input.periodEnd,
        nextRenewalAt: input.periodEnd,
        autoRenew: true,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      };
    },
    async getSubscriptionByCompanyId(companyId) {
      return companyId === COMPANY_ID ? { ...subscription } : null;
    },
    async resolveCompanyOwnerUserId() {
      return OWNER_CTX.userId;
    },
  };

  return {
    repo,
    getSubscription: () => subscription,
    getPayments: () => [...payments.values()],
  };
}

function toWebhookRecord(p: PaymentModel & { metadata: Record<string, unknown> }): PaymentWebhookRecord {
  return {
    id: p.id,
    companyId: p.companyId,
    subscriptionId: p.subscriptionId,
    gateway: p.gateway,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    gatewayReference: p.gatewayReference,
    providerEventId: null,
    metadata: p.metadata,
  };
}

const noopActivity = { log: async () => {} };

async function run() {
  const results: { name: string; pass: boolean; detail?: string }[] = [];
  const assert = (name: string, cond: boolean, detail?: string) => {
    results.push({ name, pass: cond, detail });
    if (!cond) console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  };

  try {
    assertCanStartCheckout(OWNER_CTX as Parameters<typeof assertCanStartCheckout>[0]);
    assert("Owner can start checkout", true);
  } catch {
    assert("Owner can start checkout", false);
  }
  try {
    assertCanStartCheckout({
      ...OWNER_CTX,
      role: "admin",
    } as Parameters<typeof assertCanStartCheckout>[0]);
    assert("Admin can start checkout", true);
  } catch {
    assert("Admin can start checkout", false);
  }
  try {
    assertCanStartCheckout(ACCOUNTANT_CTX as Parameters<typeof assertCanStartCheckout>[0]);
    assert("Accountant blocked from checkout", false, "should throw");
  } catch (e) {
    assert(
      "Accountant blocked from checkout",
      e instanceof UseCaseError && e.code === "FORBIDDEN"
    );
  }
  try {
    assertCanStartCheckout({
      ...OWNER_CTX,
      role: "viewer",
    } as Parameters<typeof assertCanStartCheckout>[0]);
    assert("Viewer blocked from checkout", false);
  } catch (e) {
    assert("Viewer blocked from checkout", e instanceof UseCaseError && e.code === "FORBIDDEN");
  }

  const { repo, getSubscription, getPayments } = createMockRepo();
  const webhook = buildPaymentWebhookHandler({ repository: repo, activityLog: noopActivity });

  const ownerCtx = OWNER_CTX as Parameters<typeof repo.createPendingPayment>[0];

  const paymentId = await repo.createPendingPayment(ownerCtx, {
    subscriptionId: SUB_ID,
    gateway: "manual",
    amount: 399,
    currency: "SAR",
    planCode: "sanadat_annual",
    billingCycle: "yearly",
  });
  const gatewayReference = "manual_ref_qa_test_001";
  await repo.attachCheckoutSession(COMPANY_ID, paymentId, {
    checkoutSessionId: "manual_sess_qa",
    gatewayReference,
    checkoutUrl: "http://localhost/mock",
    gateway: "manual",
  });
  const listed = await repo.listPayments(ownerCtx);
  assert("Checkout creates pending payment", listed.some((p) => p.id === paymentId && p.status === "pending"));
  assert(
    "Payment history shows pending payment",
    listed[0]?.status === "pending" && listed[0]?.gatewayReference === gatewayReference
  );

  const completed = await webhook.processPaymentWebhook({
    gateway: "manual",
    provider_event_id: "evt_qa_complete_001",
    gateway_reference: gatewayReference,
    status: "completed",
    amount: 399,
    currency: "SAR",
    paid_at: "2026-06-03T12:00:00.000Z",
  });
  const subAfter = getSubscription();
  const paidRow = getPayments().find((p) => p.id === paymentId);
  assert("Webhook completed: payment completed", paidRow?.status === "completed");
  assert("Webhook completed: subscription active", subAfter.status === "active");
  assert(
    "Webhook completed: next_renewal_at set",
    subAfter.nextRenewalAt != null && subAfter.nextRenewalAt === subAfter.expiresAt
  );
  assert("Webhook completed: ok", completed.ok && completed.status === "completed");

  const dup = await webhook.processPaymentWebhook({
    gateway: "manual",
    provider_event_id: "evt_qa_complete_001",
    gateway_reference: gatewayReference,
    status: "completed",
    amount: 399,
    currency: "SAR",
    paid_at: "2026-06-03T12:00:00.000Z",
  });
  assert("Duplicate webhook ignored", dup.duplicate === true);
  assert(
    "Duplicate webhook: subscription unchanged",
    getSubscription().expiresAt === subAfter.expiresAt
  );

  const pay2 = await repo.createPendingPayment(ownerCtx, {
    subscriptionId: SUB_ID,
    gateway: "manual",
    amount: 399,
    currency: "SAR",
    planCode: "sanadat_annual",
    billingCycle: "yearly",
  });
  const ref2 = "manual_ref_qa_mismatch";
  await repo.attachCheckoutSession(COMPANY_ID, pay2, {
    checkoutSessionId: "s2",
    gatewayReference: ref2,
    checkoutUrl: "http://localhost/mock",
    gateway: "manual",
  });
  let mismatchCode = "";
  try {
    await webhook.processPaymentWebhook({
      gateway: "manual",
      provider_event_id: "evt_qa_mismatch",
      gateway_reference: ref2,
      status: "completed",
      amount: 1,
      currency: "SAR",
      paid_at: "2026-06-03T12:00:00.000Z",
    });
  } catch (e) {
    if (e instanceof UseCaseError) mismatchCode = e.code;
  }
  assert("Amount mismatch rejected", mismatchCode === "VALIDATION");

  const pay3 = await repo.createPendingPayment(ownerCtx, {
    subscriptionId: SUB_ID,
    gateway: "manual",
    amount: 399,
    currency: "SAR",
    planCode: "sanadat_annual",
    billingCycle: "yearly",
  });
  const ref3 = "manual_ref_qa_fail";
  await repo.attachCheckoutSession(COMPANY_ID, pay3, {
    checkoutSessionId: "s3",
    gatewayReference: ref3,
    checkoutUrl: "http://localhost/mock",
    gateway: "manual",
  });
  const subBeforeFail = getSubscription();
  await webhook.processPaymentWebhook({
    gateway: "manual",
    provider_event_id: "evt_qa_fail_001",
    gateway_reference: ref3,
    status: "failed",
    amount: 399,
    currency: "SAR",
    failed_at: "2026-06-03T12:05:00.000Z",
  });
  const failedRow = getPayments().find((p) => p.id === pay3);
  assert("Failed webhook: payment failed", failedRow?.status === "failed");
  assert(
    "Failed webhook: subscription unchanged",
    getSubscription().expiresAt === subBeforeFail.expiresAt &&
      getSubscription().status === subBeforeFail.status
  );

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\nBilling QA: ${passed}/${results.length} passed`);
  if (failed.length) {
    failed.forEach((r) => console.log(`  ✗ ${r.name}${r.detail ? `: ${r.detail}` : ""}`));
    process.exit(1);
  }
  console.log("All billing QA checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
