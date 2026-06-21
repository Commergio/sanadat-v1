import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPaymentVoucherUseCases } from "@/application/documents";
import { buildPaymentApprovalUseCases } from "@/application/documents/payment-approval.use-cases";
import {
  ActivityLogRepository,
  CustomerRepository,
  SupabasePaymentVoucherRepository,
} from "@/infrastructure/supabase/repositories";
import { PaymentApprovalRepository } from "@/infrastructure/supabase/repositories/documents/payment-approval.repository";
import { uploadPaymentApprovalSignature } from "@/lib/storage/customer-signature";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export function buildPaymentVoucherApp(supabase: SupabaseClient) {
  const repository = new SupabasePaymentVoucherRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);
  const customerRepository = new CustomerRepository(supabase);
  const approvalRepository = new PaymentApprovalRepository(supabase);

  const paymentUseCases = buildPaymentVoucherUseCases({
    repository,
    activityLog,
  });

  const approvalUseCases = buildPaymentApprovalUseCases({
    paymentRepository: repository,
    customerRepository,
    approvalRepository,
    activityLog,
    uploadApprovalSignature: (companyId, paymentId, buffer, contentType) =>
      uploadPaymentApprovalSignature(supabase, companyId, paymentId, buffer, contentType),
  });

  return {
    ...paymentUseCases,
    ...approvalUseCases,
  };
}

/** Public payment approval APIs — service role for storage + RPC */
export function buildPaymentApprovalPublicApp() {
  const supabase = createServiceRoleClient();
  const repository = new SupabasePaymentVoucherRepository(supabase);
  const customerRepository = new CustomerRepository(supabase);
  const approvalRepository = new PaymentApprovalRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildPaymentApprovalUseCases({
    paymentRepository: repository,
    customerRepository,
    approvalRepository,
    activityLog,
    uploadApprovalSignature: (companyId, paymentId, buffer, contentType) =>
      uploadPaymentApprovalSignature(supabase, companyId, paymentId, buffer, contentType),
  });
}
