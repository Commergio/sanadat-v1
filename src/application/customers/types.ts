import type { Customer } from "@/domain";

export type CustomerModel = Customer;

export interface CustomerListResult {
  items: CustomerModel[];
}
