export { isSupabaseConfigured, getAppUrl } from "@/lib/env";

export const SUBSCRIPTION_PRICE = 399;
export const SUBSCRIPTION_CURRENCY = "SAR";
export const SUBSCRIPTION_PERIOD = "yearly";

/** Official support email and phone numbers (Commergio / Sanadat). */
export const SUPPORT_EMAIL = "tech@commergio.com";
export const SUPPORT_WHATSAPP_E164 = "966567395986";
export const SUPPORT_PHONE_DISPLAY = "+966 567395986";
export const SUPPORT_PHONE_2_E164 = "966562270319";
export const SUPPORT_PHONE_2_DISPLAY = "+966 562270319";

export const SUPPORT_CONTACT_PHONES = [
  { e164: SUPPORT_WHATSAPP_E164, display: SUPPORT_PHONE_DISPLAY, whatsapp: true },
  { e164: SUPPORT_PHONE_2_E164, display: SUPPORT_PHONE_2_DISPLAY, whatsapp: false },
] as const;

/** Max combined receipt + payment + invoice documents during trial. */
export const TRIAL_DOCUMENT_LIMIT = 5;

export const EXPIRY_NOTIFICATION_DAYS = [7, 3, 1] as const;

export const PRIMARY_COLOR = "#4F46E5";

export const NAV_LINKS = [
  { href: "#features", key: "features" as const },
  { href: "#how-it-works", key: "howItWorks" as const },
  { href: "#showcase", key: "showcase" as const },
  { href: "#pricing", key: "pricing" as const },
  { href: "#faq", key: "faq" as const },
] as const;

export const PAYMENT_GATEWAYS = {
  moyasar: "Moyasar",
  hyperpay: "HyperPay",
  stc_pay: "STC Pay",
} as const;
