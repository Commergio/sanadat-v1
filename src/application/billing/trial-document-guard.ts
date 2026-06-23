import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/domain";
import { UseCaseError } from "@/application/shared/use-case-error";
import {
  getTenantDocumentUsage,
  SUBSCRIPTION_EXPIRED_MESSAGE_EN,
  SUBSCRIPTION_INACTIVE_MESSAGE_EN,
  TRIAL_LIMIT_MESSAGE_EN,
} from "./trial-document-usage";

export function createTrialDocumentGuard(supabase: SupabaseClient) {
  return {
    getUsage(ctx: TenantContext) {
      return getTenantDocumentUsage(supabase, { companyId: ctx.companyId });
    },

    async assertCanCreate(ctx: TenantContext): Promise<void> {
      const usage = await getTenantDocumentUsage(supabase, { companyId: ctx.companyId });

      if (usage.subscriptionStatus === "active") {
        if (!usage.subscriptionPeriodActive) {
          throw new UseCaseError("SUBSCRIPTION_EXPIRED", SUBSCRIPTION_EXPIRED_MESSAGE_EN);
        }
        return;
      }

      if (usage.subscriptionStatus === "trialing") {
        if (!usage.subscriptionPeriodActive) {
          throw new UseCaseError("SUBSCRIPTION_INACTIVE", SUBSCRIPTION_INACTIVE_MESSAGE_EN);
        }
        if (usage.totalDocuments >= usage.trialLimit) {
          throw new UseCaseError("TRIAL_LIMIT_REACHED", TRIAL_LIMIT_MESSAGE_EN);
        }
        return;
      }

      throw new UseCaseError("SUBSCRIPTION_INACTIVE", SUBSCRIPTION_INACTIVE_MESSAGE_EN);
    },
  };
}

export type TrialDocumentGuard = ReturnType<typeof createTrialDocumentGuard>;
