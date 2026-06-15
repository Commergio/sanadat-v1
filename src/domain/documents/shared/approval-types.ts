export type DocumentLifecycleStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "issued"
  | "rejected"
  | "cancelled";

/** Approval metadata columns shared across receipt, payment, and invoice tables */
export interface DocumentApprovalFields {
  lifecycleStatus: DocumentLifecycleStatus;
  customerId: string | null;
  approvalTokenHash: string | null;
  approvalSentAt: string | null;
  approvalExpiresAt: string | null;
  approvalTokenUsedAt: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  approvedByPhone: string | null;
  customerSignaturePath: string | null;
  approvalIp: string | null;
  approvalUserAgent: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  approvalSnapshotVersion: number;
  contentLockedAt: string | null;
}

export interface DocumentApprovalSnapshot {
  id: string;
  companyId: string;
  documentType: "receipt_voucher" | "payment_voucher" | "invoice";
  documentId: string;
  version: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentApprovalToken {
  tokenHash: string;
  companyId: string;
  documentType: "receipt_voucher" | "payment_voucher" | "invoice";
  documentId: string;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
}
