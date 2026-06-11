export interface MoyasarWebhookPayload {
  id: string;
  type: string;
  created_at: string;
  secret_token?: string;
  live?: boolean;
  data: MoyasarWebhookPaymentData;
}

export interface MoyasarWebhookPaymentData {
  id: string;
  status?: string;
  amount: number;
  currency: string;
  invoice_id?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, string>;
  source?: { message?: string };
}
