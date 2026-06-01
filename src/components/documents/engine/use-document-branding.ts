"use client";

import { useCompany } from "@/hooks/use-company";
import type { Company } from "@/lib/types";

const DEFAULT_WHATSAPP_PHONE = "966500000000";

const EMPTY_COMPANY: Company = {
  id: "",
  owner_id: "",
  name: "",
  profile_completed: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/** Resolve company branding for document rendering and sharing. */
export function useDocumentBranding(override?: Company): Company {
  const { company: storeCompany } = useCompany();
  return override ?? storeCompany ?? EMPTY_COMPANY;
}

/** Normalize company phone to international WhatsApp format. */
export function resolveWhatsAppPhone(company: Company): string {
  const digits = company.phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 9) return DEFAULT_WHATSAPP_PHONE;
  if (digits.startsWith("966")) return digits;
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  return digits;
}
