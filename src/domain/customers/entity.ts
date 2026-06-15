/** Tenant-scoped customer record for document approval flows */
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string | null;
  nationalId: string | null;
  defaultSignaturePath: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  nationalId?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string | null;
  nationalId?: string | null;
}
