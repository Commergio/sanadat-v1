import type { PaymentMethod } from "@/domain";

export interface PaymentApprovalSnapshot {
  date: string;
  amount: number;
  partyName: string;
  description: string | null;
  paymentMethod: PaymentMethod;
  transferNumber: string | null;
  bankName: string | null;
  referenceNumber: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
}

export interface PaymentApprovalPayload {
  paymentId: string;
  companyId: string;
  companyName: string;
  companyNameEn: string | null;
  companyPhone: string | null;
  companyCrNumber: string | null;
  companyVatNumber: string | null;
  companyAddress: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerVerified: boolean;
  customerSignaturePath: string | null;
  lifecycleStatus: string;
  snapshot: PaymentApprovalSnapshot;
  tokenExpiresAt: string | null;
  tokenUsedAt: string | null;
  tokenExpired: boolean;
  tokenValid: boolean;
}

export interface SendPaymentApprovalResult {
  approvalUrl: string;
  whatsAppUrl: string;
  expiresAt: string;
  customerPhone: string;
}

export interface ApprovePaymentResult {
  paymentId: string;
  companyId: string;
  displayNumber: string;
}
