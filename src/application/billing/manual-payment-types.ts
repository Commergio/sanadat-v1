export type ManualPaymentStatus = "pending" | "approved" | "rejected";

export interface ManualPaymentRequestModel {
  id: string;
  companyId: string;
  companyName?: string | null;
  subscriptionId: string | null;
  requestedBy: string;
  amount: number;
  currency: string;
  planCode: string;
  billingCycle: "yearly";
  couponCode?: string | null;
  couponId?: string | null;
  originalAmount?: number | null;
  discountAmount?: number | null;
  status: ManualPaymentStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitManualPaymentResult {
  requestId: string;
  status: ManualPaymentStatus;
}

export interface ApproveManualPaymentResult {
  requestId: string;
  paymentId: string;
  companyId: string;
  subscriptionId: string;
}

export interface RejectManualPaymentResult {
  requestId: string;
  companyId: string;
}
