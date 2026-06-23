/** @deprecated Use PlatformRole on profiles; kept for legacy DB column */
export type UserRole = "client" | "admin";

export type PlatformRole = "platform_admin" | "platform_support";

export type TenantRole = "owner" | "admin" | "accountant" | "viewer";

export type SubscriptionStatus =
  | "active"
  | "expired"
  | "suspended"
  | "trialing"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

export type DocumentType = "receipt_voucher" | "payment_voucher" | "invoice";

export type DocumentStatus = "active" | "cancelled";

export type DocumentLifecycleStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "issued"
  | "rejected"
  | "cancelled";

export type PaymentMethod = "cash" | "bank_transfer" | "pos";

export type PaymentGateway = "moyasar" | "hyperpay" | "stc_pay" | "manual";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type InvoicePaymentStatus = "paid" | "unpaid" | "partial";

export interface Company {
  id: string;
  /** @deprecated Use owner_id; kept for DB compatibility */
  user_id?: string;
  owner_id: string;
  name: string;
  name_en?: string;
  cr_number?: string;
  vat_number?: string;
  license_number?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  responsible_person?: string;
  logo_url?: string;
  signature_url?: string;
  stamp_url?: string;
  profile_completed: number;
  created_at: string;
  updated_at: string;
}

export type SubscriptionSource = "trial" | "paid" | "promo" | "admin_grant";

export interface Subscription {
  id: string;
  company_id: string;
  status: SubscriptionStatus;
  subscription_source?: SubscriptionSource;
  amount: number;
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  plan_code?: string;
  billing_cycle?: BillingCycle;
  next_renewal_at?: string;
  cancel_at_period_end?: boolean;
  cancelled_at?: string;
  cancelled_by?: string;
  created_at: string;
}

export interface DocumentBase {
  id: string;
  company_id: string;
  number?: number | null;
  display_number?: string | null;
  status: DocumentStatus;
  lifecycle_status?: DocumentLifecycleStatus;
  date: string;
  amount: number;
  description?: string;
  party_name: string;
  payment_method: PaymentMethod;
  transfer_number?: string;
  bank_name?: string;
  transfer_date?: string;
  reference_number?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  customer_id?: string | null;
  approval_sent_at?: string | null;
  approval_expires_at?: string | null;
  approved_at?: string | null;
  approved_by_name?: string | null;
  approved_by_phone?: string | null;
  customer_signature_url?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  issued_at?: string | null;
}

export interface ReceiptVoucher extends DocumentBase {
  type: "receipt_voucher";
  linked_invoice_id?: string;
}

export interface PaymentVoucher extends DocumentBase {
  type: "payment_voucher";
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice extends DocumentBase {
  type: "invoice";
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: InvoicePaymentStatus;
  linked_receipt_id?: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  national_id?: string;
  default_signature_path?: string;
  is_verified: boolean;
  verified_at?: string;
  verification_sent_at?: string;
  verification_expires_at?: string;
  signature_preview_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  company_id: string;
  subscription_id?: string;
  gateway: PaymentGateway;
  amount: number;
  status: PaymentStatus;
  gateway_reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  totalReceipts: number;
  totalPayments: number;
  totalInvoices: number;
  totalReceivedAmount: number;
  totalPaidAmount: number;
  totalInvoiceAmount: number;
  activeDocumentsCount: number;
  cancelledDocumentsCount: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string;
  daysUntilExpiry: number;
  monthlyActivity: Array<{
    month: string;
    receipts: number;
    payments: number;
    invoices: number;
  }>;
  recentDocuments: Array<{
    id: string;
    type: DocumentType;
    display_number: string;
    party_name: string;
    amount: number;
    date: string;
    status: DocumentStatus;
  }>;
}

export interface DocumentListRow {
  id: string;
  display_number: string;
  party_name: string;
  amount: number;
  date: string;
  status: DocumentStatus;
  payment_method: PaymentMethod;
}

export interface InvoiceListRow extends DocumentListRow {
  payment_status: InvoicePaymentStatus;
}
