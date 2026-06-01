import type { TenantContext } from "../shared/types";

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  nameEn: string | null;
  crNumber: string | null;
  vatNumber: string | null;
  licenseNumber: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  responsiblePerson: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  stampUrl: string | null;
  profileCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInput {
  name?: string;
  nameEn?: string;
  crNumber?: string;
  vatNumber?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  responsiblePerson?: string;
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
}

export interface CompanyRepository {
  getById(ctx: TenantContext, companyId: string): Promise<Company | null>;
  update(ctx: TenantContext, input: UpdateCompanyInput): Promise<Company>;
}
