import type { Customer, CreateCustomerInput, UpdateCustomerInput, TenantContext } from "@/domain";
import type { CustomerListQuery } from "./schemas";

export interface CustomerRepositoryPort {
  list(ctx: TenantContext, query: CustomerListQuery): Promise<Customer[]>;
  getById(ctx: TenantContext, id: string): Promise<Customer | null>;
  create(ctx: TenantContext, input: CreateCustomerInput): Promise<Customer>;
  update(ctx: TenantContext, id: string, input: UpdateCustomerInput): Promise<Customer>;
}
