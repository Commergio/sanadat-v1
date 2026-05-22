import type {
  DashboardStats,
  Invoice,
  PaymentVoucher,
  ReceiptVoucher,
} from "./types";

export const mockCompany = {
  id: "comp-1",
  name: "مؤسسة النخبة التجارية",
  name_en: "Al Nokhba Trading",
  cr_number: "1010123456",
  address: "الرياض، حي العليا، شارع التحلية",
  city: "الرياض",
  phone: "0512345678",
  email: "info@example.com",
  logo_url: undefined as string | undefined,
  profile_completed: 85,
};

export const mockSubscription = {
  status: "active" as const,
  expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  amount: 399,
  auto_renew: true,
};

export const mockDashboardStats: DashboardStats = {
  totalReceipts: 128,
  totalPayments: 64,
  totalInvoices: 42,
  subscriptionStatus: "active",
  subscriptionExpiresAt: mockSubscription.expires_at,
  daysUntilExpiry: 45,
  recentDocuments: [
    {
      id: "1",
      type: "receipt_voucher",
      display_number: "قبض-128",
      party_name: "شركة الأمل للمقاولات",
      amount: 15000,
      date: "2026-05-20",
      status: "active",
    },
    {
      id: "2",
      type: "invoice",
      display_number: "فاتورة-042",
      party_name: "مؤسسة البناء الحديث",
      amount: 28500,
      date: "2026-05-19",
      status: "active",
    },
    {
      id: "3",
      type: "payment_voucher",
      display_number: "صرف-064",
      party_name: "مورد الخدمات اللوجستية",
      amount: 8200,
      date: "2026-05-18",
      status: "active",
    },
    {
      id: "4",
      type: "receipt_voucher",
      display_number: "قبض-127",
      party_name: "محمد العتيبي",
      amount: 5000,
      date: "2026-05-17",
      status: "cancelled",
    },
  ],
};

export const mockChartData = [
  { month: "يناير", receipts: 12, payments: 8, invoices: 5 },
  { month: "فبراير", receipts: 18, payments: 10, invoices: 7 },
  { month: "مارس", receipts: 15, payments: 12, invoices: 9 },
  { month: "أبريل", receipts: 22, payments: 14, invoices: 11 },
  { month: "مايو", receipts: 28, payments: 16, invoices: 10 },
];

export const mockReceipt: ReceiptVoucher = {
  id: "r-128",
  company_id: "comp-1",
  type: "receipt_voucher",
  number: 128,
  display_number: "قبض-128",
  status: "active",
  date: "2026-05-20",
  amount: 15000,
  description: "دفعة أولى من عقد التوريد",
  party_name: "شركة الأمل للمقاولات",
  payment_method: "bank_transfer",
  transfer_number: "TRX-987654321",
  bank_name: "البنك الأهلي السعودي",
  created_at: "2026-05-20T10:00:00Z",
  updated_at: "2026-05-20T10:00:00Z",
};

export const mockPayment: PaymentVoucher = {
  id: "p-64",
  company_id: "comp-1",
  type: "payment_voucher",
  number: 64,
  display_number: "صرف-064",
  status: "active",
  date: "2026-05-18",
  amount: 8200,
  description: "سداد فاتورة مورد",
  party_name: "مورد الخدمات اللوجستية",
  payment_method: "cash",
  created_at: "2026-05-18T14:00:00Z",
  updated_at: "2026-05-18T14:00:00Z",
};

export const mockInvoice: Invoice = {
  id: "inv-42",
  company_id: "comp-1",
  type: "invoice",
  number: 42,
  display_number: "فاتورة-042",
  status: "active",
  date: "2026-05-19",
  amount: 28500,
  party_name: "مؤسسة البناء الحديث",
  payment_method: "bank_transfer",
  payment_status: "unpaid",
  items: [
    {
      id: "1",
      description: "توريد مواد بناء",
      quantity: 50,
      unit_price: 450,
      total: 22500,
    },
    {
      id: "2",
      description: "خدمات نقل وتوصيل",
      quantity: 1,
      unit_price: 6000,
      total: 6000,
    },
  ],
  subtotal: 28500,
  discount: 0,
  tax: 0,
  total: 28500,
  created_at: "2026-05-19T09:00:00Z",
  updated_at: "2026-05-19T09:00:00Z",
};
