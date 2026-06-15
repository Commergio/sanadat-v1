import type { Customer } from "@/lib/types";

export function toCustomerRow(customer: {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string | null;
  nationalId: string | null;
  defaultSignaturePath: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}): Customer {
  return {
    id: customer.id,
    company_id: customer.companyId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? undefined,
    national_id: customer.nationalId ?? undefined,
    default_signature_path: customer.defaultSignaturePath ?? undefined,
    is_verified: customer.isVerified,
    verified_at: customer.verifiedAt ?? undefined,
    created_by: customer.createdBy ?? undefined,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}
