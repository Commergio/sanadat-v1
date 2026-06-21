import type { SupabaseClient } from "@supabase/supabase-js";
import { buildInvoiceUseCases } from "@/application/documents";
import { buildInvoiceApprovalUseCases } from "@/application/documents/invoice-approval.use-cases";
import {
  ActivityLogRepository,
  CustomerRepository,
  SupabaseInvoiceRepository,
} from "@/infrastructure/supabase/repositories";
import { InvoiceApprovalRepository } from "@/infrastructure/supabase/repositories/documents/invoice-approval.repository";
import { uploadInvoiceApprovalSignature } from "@/lib/storage/customer-signature";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export function buildInvoiceApp(supabase: SupabaseClient) {
  const repository = new SupabaseInvoiceRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);
  const customerRepository = new CustomerRepository(supabase);
  const approvalRepository = new InvoiceApprovalRepository(supabase);

  const invoiceUseCases = buildInvoiceUseCases({
    repository,
    activityLog,
  });

  const approvalUseCases = buildInvoiceApprovalUseCases({
    invoiceRepository: repository,
    customerRepository,
    approvalRepository,
    activityLog,
    uploadApprovalSignature: (companyId, invoiceId, buffer, contentType) =>
      uploadInvoiceApprovalSignature(supabase, companyId, invoiceId, buffer, contentType),
  });

  return {
    ...invoiceUseCases,
    ...approvalUseCases,
  };
}

/** Public invoice approval APIs — service role for storage + RPC */
export function buildInvoiceApprovalPublicApp() {
  const supabase = createServiceRoleClient();
  const repository = new SupabaseInvoiceRepository(supabase);
  const customerRepository = new CustomerRepository(supabase);
  const approvalRepository = new InvoiceApprovalRepository(supabase);
  const activityLog = new ActivityLogRepository(supabase);

  return buildInvoiceApprovalUseCases({
    invoiceRepository: repository,
    customerRepository,
    approvalRepository,
    activityLog,
    uploadApprovalSignature: (companyId, invoiceId, buffer, contentType) =>
      uploadInvoiceApprovalSignature(supabase, companyId, invoiceId, buffer, contentType),
  });
}
