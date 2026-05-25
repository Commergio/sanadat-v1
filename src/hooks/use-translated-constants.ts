"use client";

import { useTranslations } from "next-intl";
import type { PaymentMethod } from "@/lib/types";

export function usePaymentMethodLabel(method: PaymentMethod) {
  const t = useTranslations("paymentMethods");
  return t(method);
}

export function usePaymentMethods() {
  const t = useTranslations("paymentMethods");
  return {
    cash: t("cash"),
    bank_transfer: t("bank_transfer"),
    pos: t("pos"),
  } as Record<PaymentMethod, string>;
}

export function useDocumentTypeLabel(type: keyof typeof documentTypeKeys) {
  const t = useTranslations("documents");
  const map = {
    receipt_voucher: t("receipt"),
    payment_voucher: t("payment"),
    invoice: t("invoice"),
  };
  return map[type];
}

const documentTypeKeys = {
  receipt_voucher: true,
  payment_voucher: true,
  invoice: true,
};

export function useDocumentPrefix(type: keyof typeof documentTypeKeys) {
  const t = useTranslations("documentPrefixes");
  return t(type);
}
