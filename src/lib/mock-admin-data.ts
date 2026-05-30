import { DEMO_BUSINESSES } from "./mock-data";

export type AdminClientStatus = "active" | "expired" | "suspended" | "expiring_soon";

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: AdminClientStatus;
  subscriptionExpires: string;
  autoRenew: boolean;
  documentsCount: number;
  joinedAt: string;
}

export interface AdminSubscription {
  id: string;
  clientId: string;
  clientName: string;
  status: "active" | "expired" | "expiring_soon";
  renewalDate: string;
  planPrice: number;
  autoRenew: boolean;
}

export interface AdminPayment {
  id: string;
  transactionId: string;
  clientName: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  date: string;
}

export interface AdminActivity {
  id: string;
  type: "subscription" | "payment" | "client" | "system";
  clientName: string;
  descriptionKey: string;
  time: string;
}

export interface AdminMessageTemplate {
  id: string;
  nameKey: string;
  bodyKey: string;
  category: "renewal" | "activation" | "maintenance" | "update";
}

export const ADMIN_PLAN_PRICE = 399;

export const adminOverviewStats = {
  totalClients: 248,
  activeClients: 231,
  expiredSubscriptions: 11,
  expiringSoon: 6,
  monthlyRevenue: 22437,
  arr: 92352,
  monthlyGrowth: 9.8,
};

export const adminClients: AdminClient[] = [
  {
    id: "c1",
    name: DEMO_BUSINESSES.nokhba,
    email: "info@nokhba.sa",
    phone: "0512345678",
    status: "active",
    subscriptionExpires: "2026-08-15",
    autoRenew: true,
    documentsCount: 128,
    joinedAt: "2024-03-12",
  },
  {
    id: "c2",
    name: DEMO_BUSINESSES.ofuq,
    email: "billing@ofuq.sa",
    phone: "0559876543",
    status: "active",
    subscriptionExpires: "2026-09-20",
    autoRenew: true,
    documentsCount: 86,
    joinedAt: "2024-06-01",
  },
  {
    id: "c3",
    name: DEMO_BUSINESSES.ruaya,
    email: "accounts@ruaya.sa",
    phone: "0501122334",
    status: "expiring_soon",
    subscriptionExpires: "2026-06-12",
    autoRenew: true,
    documentsCount: 54,
    joinedAt: "2024-11-20",
  },
  {
    id: "c4",
    name: DEMO_BUSINESSES.ibdaa,
    email: "office@ibdaa.sa",
    phone: "0544433221",
    status: "active",
    subscriptionExpires: "2027-01-08",
    autoRenew: true,
    documentsCount: 72,
    joinedAt: "2023-08-08",
  },
  {
    id: "c5",
    name: DEMO_BUSINESSES.lamsa,
    email: "hello@lamsa.sa",
    phone: "0538765432",
    status: "expired",
    subscriptionExpires: "2026-04-01",
    autoRenew: false,
    documentsCount: 31,
    joinedAt: "2025-01-15",
  },
];

export const adminSubscriptions: AdminSubscription[] = adminClients.map((c) => ({
  id: `s-${c.id}`,
  clientId: c.id,
  clientName: c.name,
  status:
    c.status === "expired"
      ? "expired"
      : c.status === "expiring_soon"
        ? "expiring_soon"
        : "active",
  renewalDate: c.subscriptionExpires,
  planPrice: ADMIN_PLAN_PRICE,
  autoRenew: c.autoRenew,
}));

export const adminPayments: AdminPayment[] = [
  {
    id: "p1",
    transactionId: "TXN-20260501-8841",
    clientName: DEMO_BUSINESSES.nokhba,
    amount: 399,
    status: "completed",
    method: "moyasar",
    date: "2026-05-01",
  },
  {
    id: "p2",
    transactionId: "TXN-20260518-7720",
    clientName: DEMO_BUSINESSES.ofuq,
    amount: 399,
    status: "completed",
    method: "hyperpay",
    date: "2026-05-18",
  },
  {
    id: "p3",
    transactionId: "TXN-20260520-6612",
    clientName: DEMO_BUSINESSES.ruaya,
    amount: 399,
    status: "pending",
    method: "stc_pay",
    date: "2026-05-20",
  },
  {
    id: "p4",
    transactionId: "TXN-20260522-5599",
    clientName: DEMO_BUSINESSES.ibdaa,
    amount: 399,
    status: "completed",
    method: "mada",
    date: "2026-05-22",
  },
  {
    id: "p5",
    transactionId: "TXN-20260524-4488",
    clientName: DEMO_BUSINESSES.lamsa,
    amount: 399,
    status: "failed",
    method: "visa",
    date: "2026-05-24",
  },
];

export const adminRecentActivity: AdminActivity[] = [
  {
    id: "a1",
    type: "payment",
    clientName: DEMO_BUSINESSES.lamsa,
    descriptionKey: "activityPaymentFailed",
    time: "2026-05-24T10:30:00",
  },
  {
    id: "a2",
    type: "subscription",
    clientName: DEMO_BUSINESSES.ibdaa,
    descriptionKey: "activitySubRenewed",
    time: "2026-05-22T14:15:00",
  },
  {
    id: "a3",
    type: "client",
    clientName: DEMO_BUSINESSES.ruaya,
    descriptionKey: "activityClientSuspended",
    time: "2026-05-21T09:00:00",
  },
  {
    id: "a4",
    type: "payment",
    clientName: DEMO_BUSINESSES.ofuq,
    descriptionKey: "activityPaymentSuccess",
    time: "2026-05-18T16:45:00",
  },
  {
    id: "a5",
    type: "system",
    clientName: "—",
    descriptionKey: "activityMaintenance",
    time: "2026-05-17T08:00:00",
  },
];

export const adminMessageTemplates: AdminMessageTemplate[] = [
  {
    id: "t1",
    nameKey: "templateRenewal",
    bodyKey: "templateRenewalBody",
    category: "renewal",
  },
  {
    id: "t2",
    nameKey: "templateActivation",
    bodyKey: "templateActivationBody",
    category: "activation",
  },
  {
    id: "t3",
    nameKey: "templateMaintenance",
    bodyKey: "templateMaintenanceBody",
    category: "maintenance",
  },
  {
    id: "t4",
    nameKey: "templateUpdate",
    bodyKey: "templateUpdateBody",
    category: "update",
  },
];

export const adminRevenueChartData = {
  ar: [
    { month: "يناير", revenue: 8200, clients: 198 },
    { month: "فبراير", revenue: 12400, clients: 210 },
    { month: "مارس", revenue: 15100, clients: 221 },
    { month: "أبريل", revenue: 18900, clients: 235 },
    { month: "مايو", revenue: 22437, clients: 248 },
  ],
  en: [
    { month: "Jan", revenue: 8200, clients: 198 },
    { month: "Feb", revenue: 12400, clients: 210 },
    { month: "Mar", revenue: 15100, clients: 221 },
    { month: "Apr", revenue: 18900, clients: 235 },
    { month: "May", revenue: 22437, clients: 248 },
  ],
};

export const adminSubscriptionBreakdown = {
  active: 231,
  expiringSoon: 6,
  expired: 11,
};
