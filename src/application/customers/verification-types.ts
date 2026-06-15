export interface CustomerVerificationPayload {
  customerId: string;
  companyId: string;
  companyName: string;
  customerName: string;
  customerPhone: string;
  isVerified: boolean;
  tokenValid: boolean;
  tokenExpired: boolean;
  tokenUsed: boolean;
}

export interface SendCustomerVerificationResult {
  verificationUrl: string;
  expiresAt: string;
}
