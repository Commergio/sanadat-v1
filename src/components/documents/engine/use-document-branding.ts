"use client";

import { useCompany, getDefaultCompany } from "@/hooks/use-company";
import { mockCompany } from "@/lib/mock-data";
import type { Company } from "@/lib/types";

const DEFAULT_WHATSAPP_PHONE = "966500000000";

/** Resolve company branding for document rendering and sharing. */
export function useDocumentBranding(override?: Company): Company {
  const { company: storeCompany } = useCompany();
  return override ?? storeCompany ?? getDefaultCompany();
}

/** Normalize company phone to international WhatsApp format. */
export function resolveWhatsAppPhone(company: Company): string {
  const digits = company.phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 9) return DEFAULT_WHATSAPP_PHONE;
  if (digits.startsWith("966")) return digits;
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  return digits;
}
