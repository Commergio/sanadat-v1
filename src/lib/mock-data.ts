import type {
  DashboardStats,
  DocumentListRow,
  Invoice,
  InvoiceListRow,
  PaymentVoucher,
  ReceiptVoucher,
} from "./types";

export type { DocumentListRow, InvoiceListRow } from "./types";

/** Named Saudi demo businesses used across client & admin views */
export const DEMO_BUSINESSES = {
  nokhba: "مؤسسة النخبة التجارية",
  ofuq: "شركة الأفق للمقاولات",
  ruaya: "مركز الرؤية للخدمات",
  ibdaa: "مكتب الإبداع الهندسي",
  lamsa: "صالون اللمسة الذهبية",
} as const;

export const mockCompany = {
  id: "comp-1",
  owner_id: "demo-user",
  user_id: "demo-user",
  name: DEMO_BUSINESSES.nokhba,
  name_en: "Al Nokhba Trading Est.",
  cr_number: "1010123456",
  vat_number: undefined as string | undefined,
  license_number: "LIC-2024-8841",
  address: "الرياض، حي العليا، شارع التحلية",
  city: "الرياض",
  phone: "0512345678",
  email: "info@nokhba.sa",
  responsible_person: "أحمد محمد العتيبي",
  logo_url: undefined as string | undefined,
  signature_url: undefined as string | undefined,
  stamp_url: undefined as string | undefined,
  profile_completed: 88,
  created_at: "2024-03-12T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z",
};

export const mockSubscription = {
  status: "active" as const,
  expires_at: "2026-08-15T00:00:00.000Z",
  amount: 399,
  auto_renew: true,
};

export const mockReceiptsList: DocumentListRow[] = [
  {
    id: "1",
    display_number: "قبض-128",
    party_name: DEMO_BUSINESSES.ofuq,
    amount: 18500,
    date: "2026-05-20",
    status: "active",
    payment_method: "bank_transfer",
  },
  {
    id: "2",
    display_number: "قبض-127",
    party_name: DEMO_BUSINESSES.ruaya,
    amount: 9200,
    date: "2026-05-17",
    status: "active",
    payment_method: "cash",
  },
  {
    id: "3",
    display_number: "قبض-126",
    party_name: DEMO_BUSINESSES.lamsa,
    amount: 4500,
    date: "2026-05-15",
    status: "cancelled",
    payment_method: "pos",
  },
];

export const mockPaymentsList: DocumentListRow[] = [
  {
    id: "1",
    display_number: "صرف-064",
    party_name: DEMO_BUSINESSES.ibdaa,
    amount: 12400,
    date: "2026-05-18",
    status: "active",
    payment_method: "bank_transfer",
  },
  {
    id: "2",
    display_number: "صرف-063",
    party_name: DEMO_BUSINESSES.ruaya,
    amount: 7800,
    date: "2026-05-14",
    status: "active",
    payment_method: "cash",
  },
];

export const mockInvoicesList: InvoiceListRow[] = [
  {
    id: "1",
    display_number: "فاتورة-042",
    party_name: DEMO_BUSINESSES.ofuq,
    amount: 45750,
    date: "2026-05-19",
    status: "active",
    payment_method: "bank_transfer",
    payment_status: "unpaid",
  },
  {
    id: "2",
    display_number: "فاتورة-041",
    party_name: DEMO_BUSINESSES.ibdaa,
    amount: 28800,
    date: "2026-05-12",
    status: "active",
    payment_method: "bank_transfer",
    payment_status: "paid",
  },
];

const receiptDetails: Record<string, ReceiptVoucher> = {
  "1": {
    id: "1",
    company_id: "comp-1",
    type: "receipt_voucher",
    number: 128,
    display_number: "قبض-128",
    status: "active",
    date: "2026-05-20",
    amount: 18500,
    description: "دفعة أولى — أعمال مقاولات مشروع حي النرجس",
    party_name: DEMO_BUSINESSES.ofuq,
    payment_method: "bank_transfer",
    transfer_number: "TRX-20260520-8841",
    bank_name: "البنك الأهلي السعودي",
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
  },
  "2": {
    id: "2",
    company_id: "comp-1",
    type: "receipt_voucher",
    number: 127,
    display_number: "قبض-127",
    status: "active",
    date: "2026-05-17",
    amount: 9200,
    description: "تسوية مستحقات خدمات استشارية",
    party_name: DEMO_BUSINESSES.ruaya,
    payment_method: "cash",
    created_at: "2026-05-17T11:30:00Z",
    updated_at: "2026-05-17T11:30:00Z",
  },
  "3": {
    id: "3",
    company_id: "comp-1",
    type: "receipt_voucher",
    number: 126,
    display_number: "قبض-126",
    status: "cancelled",
    date: "2026-05-15",
    amount: 4500,
    description: "دفعة حجز — ملغاة بناءً على طلب العميل",
    party_name: DEMO_BUSINESSES.lamsa,
    payment_method: "pos",
    created_at: "2026-05-15T09:00:00Z",
    updated_at: "2026-05-16T14:00:00Z",
  },
};

const paymentDetails: Record<string, PaymentVoucher> = {
  "1": {
    id: "1",
    company_id: "comp-1",
    type: "payment_voucher",
    number: 64,
    display_number: "صرف-064",
    status: "active",
    date: "2026-05-18",
    amount: 12400,
    description: "سداد مستحقات التصميم الهندسي — مشروع تجاري",
    party_name: DEMO_BUSINESSES.ibdaa,
    payment_method: "bank_transfer",
    transfer_number: "TRX-20260518-5521",
    bank_name: "بنك الراجحي",
    created_at: "2026-05-18T14:00:00Z",
    updated_at: "2026-05-18T14:00:00Z",
  },
  "2": {
    id: "2",
    company_id: "comp-1",
    type: "payment_voucher",
    number: 63,
    display_number: "صرف-063",
    status: "active",
    date: "2026-05-14",
    amount: 7800,
    description: "دفعة خدمات تشغيل وصيانة",
    party_name: DEMO_BUSINESSES.ruaya,
    payment_method: "cash",
    created_at: "2026-05-14T16:00:00Z",
    updated_at: "2026-05-14T16:00:00Z",
  },
};

const invoiceDetails: Record<string, Invoice> = {
  "1": {
    id: "1",
    company_id: "comp-1",
    type: "invoice",
    number: 42,
    display_number: "فاتورة-042",
    status: "active",
    date: "2026-05-19",
    amount: 45750,
    party_name: DEMO_BUSINESSES.ofuq,
    payment_method: "bank_transfer",
    payment_status: "unpaid",
    items: [
      {
        id: "1",
        description: "أعمال هيكل خرساني — المرحلة الأولى",
        quantity: 1,
        unit_price: 32000,
        total: 32000,
      },
      {
        id: "2",
        description: "توريد وتركيب حديد تسليح",
        quantity: 15,
        unit_price: 650,
        total: 9750,
      },
      {
        id: "3",
        description: "إشراف هندسي ميداني",
        quantity: 1,
        unit_price: 4000,
        total: 4000,
      },
    ],
    subtotal: 45750,
    discount: 0,
    tax: 0,
    total: 45750,
    created_at: "2026-05-19T09:00:00Z",
    updated_at: "2026-05-19T09:00:00Z",
  },
  "2": {
    id: "2",
    company_id: "comp-1",
    type: "invoice",
    number: 41,
    display_number: "فاتورة-041",
    status: "active",
    date: "2026-05-12",
    amount: 28800,
    party_name: DEMO_BUSINESSES.ibdaa,
    payment_method: "bank_transfer",
    payment_status: "paid",
    items: [
      {
        id: "1",
        description: "تصميم معماري — مبنى إداري",
        quantity: 1,
        unit_price: 18000,
        total: 18000,
      },
      {
        id: "2",
        description: "مخططات تنفيذية وCAD",
        quantity: 1,
        unit_price: 10800,
        total: 10800,
      },
    ],
    subtotal: 28800,
    discount: 0,
    tax: 0,
    total: 28800,
    created_at: "2026-05-12T11:00:00Z",
    updated_at: "2026-05-14T10:00:00Z",
  },
};

export function getMockReceipt(id: string): ReceiptVoucher {
  return receiptDetails[id] ?? { ...receiptDetails["1"], id };
}

export function getMockPayment(id: string): PaymentVoucher {
  return paymentDetails[id] ?? { ...paymentDetails["1"], id };
}

export function getMockInvoice(id: string): Invoice {
  return invoiceDetails[id] ?? { ...invoiceDetails["1"], id };
}

/** Primary receipt used on landing & showcase */
export const mockReceipt: ReceiptVoucher = receiptDetails["1"];
export const mockPayment: PaymentVoucher = paymentDetails["1"];
export const mockInvoice: Invoice = invoiceDetails["1"];

export const mockDashboardStats: DashboardStats = {
  totalReceipts: 128,
  totalPayments: 64,
  totalInvoices: 42,
  totalReceivedAmount: 32200,
  totalPaidAmount: 20200,
  totalInvoiceAmount: 74550,
  activeDocumentsCount: 5,
  cancelledDocumentsCount: 1,
  subscriptionStatus: "active",
  subscriptionExpiresAt: mockSubscription.expires_at,
  daysUntilExpiry: 85,
  monthlyActivity: getChartData("ar"),
  recentDocuments: [
    {
      id: "1",
      type: "receipt_voucher",
      display_number: mockReceiptsList[0].display_number,
      party_name: mockReceiptsList[0].party_name,
      amount: mockReceiptsList[0].amount,
      date: mockReceiptsList[0].date,
      status: "active",
    },
    {
      id: "1",
      type: "invoice",
      display_number: mockInvoicesList[0].display_number,
      party_name: mockInvoicesList[0].party_name,
      amount: mockInvoicesList[0].amount,
      date: mockInvoicesList[0].date,
      status: "active",
    },
    {
      id: "1",
      type: "payment_voucher",
      display_number: mockPaymentsList[0].display_number,
      party_name: mockPaymentsList[0].party_name,
      amount: mockPaymentsList[0].amount,
      date: mockPaymentsList[0].date,
      status: "active",
    },
    {
      id: "3",
      type: "receipt_voucher",
      display_number: mockReceiptsList[2].display_number,
      party_name: mockReceiptsList[2].party_name,
      amount: mockReceiptsList[2].amount,
      date: mockReceiptsList[2].date,
      status: "cancelled",
    },
  ],
};

export function getChartData(locale: string) {
  if (locale === "en") {
    return [
      { month: "Jan", receipts: 12, payments: 8, invoices: 5 },
      { month: "Feb", receipts: 18, payments: 10, invoices: 7 },
      { month: "Mar", receipts: 15, payments: 12, invoices: 9 },
      { month: "Apr", receipts: 22, payments: 14, invoices: 11 },
      { month: "May", receipts: 28, payments: 16, invoices: 10 },
    ];
  }
  return [
    { month: "يناير", receipts: 12, payments: 8, invoices: 5 },
    { month: "فبراير", receipts: 18, payments: 10, invoices: 7 },
    { month: "مارس", receipts: 15, payments: 12, invoices: 9 },
    { month: "أبريل", receipts: 22, payments: 14, invoices: 11 },
    { month: "مايو", receipts: 28, payments: 16, invoices: 10 },
  ];
}
