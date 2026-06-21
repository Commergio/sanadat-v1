import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";
import type { DocumentActivityAction } from "@/application/documents";

type ApprovalDocumentType = "receipt_voucher" | "payment_voucher" | "invoice";

const SOURCE_TABLE: Record<ApprovalDocumentType, string> = {
  receipt_voucher: "receipt_vouchers",
  payment_voucher: "payment_vouchers",
  invoice: "invoices",
};

export async function logApprovalDocumentActivity(
  documentType: ApprovalDocumentType,
  documentId: string,
  companyId: string,
  actions: DocumentActivityAction[],
  metadata: Record<string, unknown>
) {
  try {
    const supabase = createServiceRoleClient();
    const { data: document } = await supabase
      .from(SOURCE_TABLE[documentType])
      .select("created_by")
      .eq("id", documentId)
      .maybeSingle();

    let actorId = document?.created_by as string | null;
    if (!actorId) {
      const { data: company } = await supabase
        .from("companies")
        .select("owner_id")
        .eq("id", companyId)
        .maybeSingle();
      actorId = (company?.owner_id as string | null) ?? null;
    }

    if (!actorId) return;

    const activityLog = new ActivityLogRepository(supabase);
    const ctx = { userId: actorId, companyId, role: "accountant" as const };
    for (const action of actions) {
      await activityLog.log(ctx, action, documentId, {
        documentType,
        actor: "customer",
        ...metadata,
      });
    }
  } catch {
    // Non-blocking
  }
}
