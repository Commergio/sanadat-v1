import type { SupabaseClient } from "@supabase/supabase-js";
import { buildReceiptVoucherUseCases } from "@/application/documents";
import { buildReceiptApprovalUseCases } from "@/application/documents/receipt-approval.use-cases";
import {
  ActivityLogRepository,
  CustomerRepository,
  SupabaseReceiptRepository,
} from "@/infrastructure/supabase/repositories";
import { ReceiptApprovalRepository } from "@/infrastructure/supabase/repositories/documents/receipt-approval.repository";
import { uploadReceiptApprovalSignature } from "@/lib/storage/customer-signature";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export function buildReceiptVoucherApp(supabase: SupabaseClient) {
  const repository = new SupabaseReceiptRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);
  const customerRepository = new CustomerRepository(supabase);
  const approvalRepository = new ReceiptApprovalRepository(supabase);

  const receiptUseCases = buildReceiptVoucherUseCases({
    repository,
    activityLog,
  });

  const approvalUseCases = buildReceiptApprovalUseCases({
    receiptRepository: repository,
    customerRepository,
    approvalRepository,
    activityLog,
    uploadApprovalSignature: (companyId, receiptId, buffer, contentType) =>
      uploadReceiptApprovalSignature(supabase, companyId, receiptId, buffer, contentType),
  });

  return {
    ...receiptUseCases,
    ...approvalUseCases,
  };
}

/** Public receipt approval APIs — service role for storage + RPC */
export function buildReceiptApprovalPublicApp() {
  const supabase = createServiceRoleClient();
  const repository = new SupabaseReceiptRepository(supabase);
  const customerRepository = new CustomerRepository(supabase);
  const approvalRepository = new ReceiptApprovalRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildReceiptApprovalUseCases({
    receiptRepository: repository,
    customerRepository,
    approvalRepository,
    activityLog,
    uploadApprovalSignature: (companyId, receiptId, buffer, contentType) =>
      uploadReceiptApprovalSignature(supabase, companyId, receiptId, buffer, contentType),
  });
}
