import { hashVerificationToken } from "@/lib/verification/token";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type ApprovalDocumentType = "receipt_voucher" | "payment_voucher";

export async function resolveApprovalDocumentType(
  token: string
): Promise<ApprovalDocumentType | null> {
  if (!token?.trim() || token.length < 16) return null;

  const tokenHash = hashVerificationToken(token);
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("document_approval_tokens")
    .select("document_type")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (data?.document_type === "payment_voucher") return "payment_voucher";
  if (data?.document_type === "receipt_voucher") return "receipt_voucher";
  return null;
}
