import type {
  CreateCustomerInput,
  Customer,
  TenantContext,
  UpdateCustomerInput,
} from "@/domain";
import type { ActivityLogPort } from "@/application/documents";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { assertCanReadCustomers, assertCanWriteCustomers } from "./authorization";
import type { CustomerRepositoryPort } from "./repository-ports";
import {
  createCustomerSchema,
  customerListQuerySchema,
  updateCustomerSchema,
  type CustomerListQuery,
} from "./schemas";

interface CustomerUseCaseDeps {
  repository: CustomerRepositoryPort;
  activityLog: ActivityLogPort;
}

function rethrowCustomerError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

export function buildCustomerUseCases(deps: CustomerUseCaseDeps) {
  return {
    async listCustomers(ctx: TenantContext, query: CustomerListQuery) {
      assertCanReadCustomers(ctx);
      const parsed = customerListQuerySchema.safeParse(query);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid list query", parsed.error.flatten());
      }
      try {
        const items = await deps.repository.list(ctx, parsed.data);
        return { items };
      } catch (error) {
        rethrowCustomerError(error, "Failed to list customers");
      }
    },

    async getCustomer(ctx: TenantContext, id: string): Promise<Customer> {
      assertCanReadCustomers(ctx);
      if (!id?.trim()) {
        throw new UseCaseError("VALIDATION", "Customer id is required");
      }
      try {
        const found = await deps.repository.getById(ctx, id);
        if (!found) throw new UseCaseError("NOT_FOUND", "Customer not found");
        return found;
      } catch (error) {
        rethrowCustomerError(error, "Failed to load customer");
      }
    },

    async createCustomer(ctx: TenantContext, input: CreateCustomerInput): Promise<Customer> {
      assertCanWriteCustomers(ctx);
      const parsed = createCustomerSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid customer input", parsed.error.flatten());
      }
      const payload: CreateCustomerInput = {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        nationalId: parsed.data.nationalId || null,
      };
      try {
        const created = await deps.repository.create(ctx, payload);
        try {
          await deps.activityLog.log(ctx, "customer.created", created.id, {
            entityType: "customer",
            name: created.name,
          });
        } catch {
          // Non-blocking
        }
        return created;
      } catch (error) {
        rethrowCustomerError(error, "Failed to create customer");
      }
    },

    async updateCustomer(
      ctx: TenantContext,
      id: string,
      input: UpdateCustomerInput
    ): Promise<Customer> {
      assertCanWriteCustomers(ctx);
      const parsed = updateCustomerSchema.safeParse(input);
      if (!parsed.success) {
        throw new UseCaseError("VALIDATION", "Invalid customer input", parsed.error.flatten());
      }
      if (!id?.trim()) {
        throw new UseCaseError("VALIDATION", "Customer id is required");
      }
      const payload: UpdateCustomerInput = {};
      if (parsed.data.name !== undefined) payload.name = parsed.data.name;
      if (parsed.data.phone !== undefined) payload.phone = parsed.data.phone;
      if (parsed.data.email !== undefined) payload.email = parsed.data.email || null;
      if (parsed.data.nationalId !== undefined) payload.nationalId = parsed.data.nationalId || null;

      try {
        const updated = await deps.repository.update(ctx, id, payload);
        try {
          await deps.activityLog.log(ctx, "customer.updated", updated.id, {
            entityType: "customer",
          });
        } catch {
          // Non-blocking
        }
        return updated;
      } catch (error) {
        rethrowCustomerError(error, "Failed to update customer");
      }
    },
  };
}

export function parseCustomerListQuery(searchParams: URLSearchParams): CustomerListQuery {
  return customerListQuerySchema.parse({
    search: searchParams.get("search") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
}
