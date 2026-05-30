import { mockCompany } from "@/lib/mock-data";
import type { Company } from "@/lib/types";

const STORAGE_KEY = "sanadat-company-settings";

export function loadStoredCompany(): Partial<Company> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Company>;
  } catch {
    return null;
  }
}

export function saveStoredCompany(data: Partial<Company>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors in demo mode
  }
}

export function buildDemoCompany(overrides?: Partial<Company> | null): Company {
  const base = mockCompany as unknown as Company;
  const now = new Date().toISOString();
  return {
    ...base,
    user_id: base.user_id ?? "demo-user",
    created_at: base.created_at ?? now,
    updated_at: now,
    ...overrides,
  };
}

export function calcCompanyProfileCompletion(data: {
  name?: string;
  cr_number?: string;
  license_number?: string;
  address?: string;
  phone?: string;
  responsible_person?: string;
  logo_url?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
}): number {
  const fields = [
    data.name,
    data.cr_number,
    data.license_number,
    data.address,
    data.phone,
    data.responsible_person,
    data.logo_url,
    data.signature_url,
    data.stamp_url,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
