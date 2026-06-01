import type { Company, Subscription } from "@/lib/types";
import type { CompanyMembership, TenantRole } from "./types";

export function mapCompanyRow(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    owner_id: (row.owner_id ?? row.user_id) as string,
    user_id: row.user_id as string | undefined,
    name: row.name as string,
    name_en: row.name_en as string | undefined,
    cr_number: row.cr_number as string | undefined,
    vat_number: row.vat_number as string | undefined,
    license_number: row.license_number as string | undefined,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    responsible_person: row.responsible_person as string | undefined,
    logo_url: row.logo_url as string | undefined,
    signature_url: row.signature_url as string | undefined,
    stamp_url: row.stamp_url as string | undefined,
    profile_completed: Number(row.profile_completed ?? 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapSubscriptionRow(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    status: row.status as Subscription["status"],
    amount: Number(row.amount),
    starts_at: row.starts_at as string,
    expires_at: row.expires_at as string,
    auto_renew: Boolean(row.auto_renew),
    created_at: row.created_at as string,
  };
}

export function mapMembershipRow(
  row: Record<string, unknown>,
  companyName: string
): CompanyMembership {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    userId: row.user_id as string,
    role: row.role as TenantRole,
    companyName,
    acceptedAt: (row.accepted_at as string) ?? null,
  };
}
