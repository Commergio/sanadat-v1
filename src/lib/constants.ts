/** معاينة بدون تسجيل — فعّلها بـ NEXT_PUBLIC_DEMO_MODE=true فقط للتجربة */
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const APP_NAME = "نظام السندات";
export const APP_DESCRIPTION =
  "منصة سعودية لرقمنة سندات القبض والصرف والفواتير غير الضريبية للمنشآت الصغيرة";

export const SUBSCRIPTION_PRICE = 399;
export const SUBSCRIPTION_CURRENCY = "SAR";
export const SUBSCRIPTION_PERIOD = "yearly";

export const EXPIRY_NOTIFICATION_DAYS = [7, 3, 1] as const;

export const PRIMARY_COLOR = "#4F46E5";

export const DOCUMENT_PREFIXES = {
  receipt_voucher: "قبض",
  payment_voucher: "صرف",
  invoice: "فاتورة",
} as const;

export const PAYMENT_METHODS = {
  cash: "نقداً",
  bank_transfer: "تحويل بنكي",
  pos: "شبكة / نقاط بيع",
} as const;

export const PAYMENT_GATEWAYS = {
  moyasar: "ميسر",
  hyperpay: "هايبر باي",
  stc_pay: "STC Pay",
} as const;

export const NAV_LINKS = [
  { href: "#features", label: "المميزات" },
  { href: "#how-it-works", label: "كيف يعمل" },
  { href: "#showcase", label: "المستندات" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#faq", label: "الأسئلة الشائعة" },
] as const;
