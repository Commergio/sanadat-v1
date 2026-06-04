import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthSession } from "@/lib/auth/session";
import type { CompanyMembership, TenantContext } from "./types";
import { TenantResolutionError } from "./errors";
import { mapCompanyRow, mapMembershipRow, mapSubscriptionRow } from "./mappers";

export { getAuthSession };

/**
 * Lists all company memberships for a user.
 */
export async function listUserMemberships(
  supabase: SupabaseClient,
  userId: string
): Promise<CompanyMembership[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select(
      `
      id,
      company_id,
      user_id,
      role,
      accepted_at,
      companies ( name )
    `
    )
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const companies = row.companies as { name: string } | { name: string }[] | null;
    const name = Array.isArray(companies)
      ? companies[0]?.name
      : companies?.name;
    return mapMembershipRow(
      row as Record<string, unknown>,
      name ?? ""
    );
  });
}

/**
 * Resolves the active tenant context for the current user.
 * @param preferredCompanyId - from cookie or explicit switch
 */
export async function resolveTenantContext(
  supabase: SupabaseClient,
  preferredCompanyId?: string | null
): Promise<TenantContext> {
  const session = await getAuthSession(supabase);
  if (!session) {
    throw new TenantResolutionError(
      "Not authenticated",
      "UNAUTHENTICATED"
    );
  }

  const memberships = await listUserMemberships(supabase, session.userId);
  if (memberships.length === 0) {
    throw new TenantResolutionError(
      "No company membership",
      "NO_MEMBERSHIP"
    );
  }

  const activeMembership =
    (preferredCompanyId
      ? memberships.find((m) => m.companyId === preferredCompanyId)
      : undefined) ?? memberships[0];

  if (!activeMembership) {
    throw new TenantResolutionError(
      "Invalid active company",
      "INVALID_COMPANY"
    );
  }

  const { data: companyRow, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", activeMembership.companyId)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!companyRow) {
    throw new TenantResolutionError(
      "Company not found",
      "COMPANY_NOT_FOUND"
    );
  }

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", activeMembership.companyId)
    .in("status", ["active", "trialing"])
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    userId: session.userId,
    email: session.email,
    companyId: activeMembership.companyId,
    role: activeMembership.role,
    membershipId: activeMembership.id,
    company: mapCompanyRow(companyRow as Record<string, unknown>),
    subscription: subscriptionRow
      ? mapSubscriptionRow(subscriptionRow as Record<string, unknown>)
      : null,
  };
}

/**
 * Server-side entry: resolve tenant from Supabase server client + cookie company id.
 */
export async function getTenantContext(
  supabase: SupabaseClient,
  activeCompanyId?: string | null
): Promise<TenantContext> {
  return resolveTenantContext(supabase, activeCompanyId);
}
