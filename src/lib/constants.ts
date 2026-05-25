/** Preview without login — enable with NEXT_PUBLIC_DEMO_MODE=true */
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const SUBSCRIPTION_PRICE = 399;
export const SUBSCRIPTION_CURRENCY = "SAR";
export const SUBSCRIPTION_PERIOD = "yearly";

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
