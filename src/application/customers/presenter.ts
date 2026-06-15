import type { Customer } from "@/lib/types";
import type { Customer as DomainCustomer } from "@/domain";

export function toCustomerRow(
  customer: DomainCustomer,
  extras?: { signaturePreviewUrl?: string | null }
): Customer {
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
    verification_sent_at: customer.verificationSentAt ?? undefined,
    verification_expires_at: customer.verificationExpiresAt ?? undefined,
    signature_preview_url: extras?.signaturePreviewUrl ?? undefined,
    created_by: customer.createdBy ?? undefined,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}
