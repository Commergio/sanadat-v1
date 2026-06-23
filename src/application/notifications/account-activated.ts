import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAccountActivatedEmail } from "@/infrastructure/email/templates/account-activated";
import { sendTransactionalEmail } from "@/infrastructure/email/resend-client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isServiceRoleConfigured } from "@/lib/env";
import { getAppUrl } from "@/lib/env";

export interface NotifyAccountActivatedInput {
  companyId: string;
  expiresAt?: string | null;
  locale?: string;
}

async function resolveCompanyOwnerContact(
  client: SupabaseClient,
  companyId: string
): Promise<{ email: string; fullName: string | null; companyName: string | null } | null> {
  const { data: company, error: companyError } = await client
    .from("companies")
    .select("name, owner_id")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError || !company?.owner_id) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("email, full_name")
    .eq("id", company.owner_id)
    .maybeSingle();

  if (profileError || !profile?.email) return null;

  return {
    email: String(profile.email),
    fullName: profile.full_name ? String(profile.full_name) : null,
    companyName: company.name ? String(company.name) : null,
  };
}

/** Sends a formatted activation email from tech@commergio.com (non-blocking for callers). */
export async function notifyAccountActivated(input: NotifyAccountActivatedInput): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  try {
    const client = createServiceRoleClient();
    const contact = await resolveCompanyOwnerContact(client, input.companyId);
    if (!contact) return;

    const locale = input.locale?.startsWith("en") ? "en" : "ar";
    const dashboardUrl = `${getAppUrl()}/${locale}/dashboard`;
    const { subject, html, text } = buildAccountActivatedEmail({
      recipientName: contact.fullName,
      companyName: contact.companyName,
      expiresAt: input.expiresAt ?? null,
      dashboardUrl,
    });

    const result = await sendTransactionalEmail({
      to: contact.email,
      subject,
      html,
      text,
    });

    if (!result.ok && !result.skipped) {
      console.error("[email] account activated failed:", result.error, contact.email);
    }
  } catch (error) {
    console.error("[email] account activated error:", error);
  }
}

export interface NotifySignupActivatedInput {
  userId: string;
  email: string;
  fullName?: string | null;
  companyName?: string | null;
  locale?: string;
}

/** Welcome email after email confirmation (signup). Idempotent via user metadata flag. */
export async function notifySignupAccountActivated(
  input: NotifySignupActivatedInput
): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  try {
    const client = createServiceRoleClient();
    const locale = input.locale?.startsWith("en") ? "en" : "ar";
    const dashboardUrl = `${getAppUrl()}/${locale}/dashboard`;
    const { subject, html, text } = buildAccountActivatedEmail({
      recipientName: input.fullName ?? input.companyName,
      companyName: input.companyName,
      dashboardUrl,
    });

    const result = await sendTransactionalEmail({
      to: input.email,
      subject,
      html,
      text,
    });

    if (!result.ok && !result.skipped) {
      console.error("[email] signup welcome failed:", result.error, input.email);
      return;
    }

    if (result.skipped) return;

    const { data: userData } = await client.auth.admin.getUserById(input.userId);
    const metadata = userData.user?.user_metadata ?? {};

    await client.auth.admin.updateUserById(input.userId, {
      user_metadata: {
        ...metadata,
        welcome_email_sent: true,
        welcome_email_sent_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[email] signup welcome error:", error);
  }
}
