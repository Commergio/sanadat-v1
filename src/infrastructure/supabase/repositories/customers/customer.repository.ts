import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerRepositoryPort } from "@/application/customers";
import type { CreateCustomerInput, Customer, TenantContext, UpdateCustomerInput } from "@/domain";
import type { CustomerListQuery } from "@/application/customers/schemas";
import { RepositoryError } from "@/application/shared/errors";
import { toRepositoryError } from "../shared/errors";

type Row = Record<string, unknown>;

function mapCustomer(row: Row): Customer {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    phone: String(row.phone),
    email: (row.email as string | null) ?? null,
    nationalId: (row.national_id as string | null) ?? null,
    defaultSignaturePath: (row.default_signature_path as string | null) ?? null,
    isVerified: Boolean(row.is_verified),
    verifiedAt: (row.verified_at as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class CustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async list(ctx: TenantContext, query: CustomerListQuery): Promise<Customer[]> {
    let builder = this.supabase
      .from("customers")
      .select("*")
      .eq("company_id", ctx.companyId)
      .order("name", { ascending: true })
      .limit(query.limit);

    if (query.search?.trim()) {
      const term = query.search.trim().replace(/[%]/g, "");
      builder = builder.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    const { data, error } = await builder;
    if (error) throw toRepositoryError(error, "Failed to list customers");
    return (data ?? []).map((row) => mapCustomer(row as Row));
  }

  async getById(ctx: TenantContext, id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load customer");
    if (!data) return null;
    return mapCustomer(data as Row);
  }

  async create(ctx: TenantContext, input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await this.supabase
      .from("customers")
      .insert({
        company_id: ctx.companyId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        national_id: input.nationalId?.trim() || null,
        created_by: ctx.userId,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "42501") {
        throw new RepositoryError("FORBIDDEN", "Forbidden to create customer", error);
      }
      throw toRepositoryError(error, "Failed to create customer");
    }
    return mapCustomer(data as Row);
  }

  async update(ctx: TenantContext, id: string, input: UpdateCustomerInput): Promise<Customer> {
    const existing = await this.getById(ctx, id);
    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Customer not found");
    }

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.email !== undefined) patch.email = input.email?.trim() || null;
    if (input.nationalId !== undefined) patch.national_id = input.nationalId?.trim() || null;

    const { data, error } = await this.supabase
      .from("customers")
      .update(patch)
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .select("*")
      .single();

    if (error) {
      if (error.code === "42501") {
        throw new RepositoryError("FORBIDDEN", "Forbidden to update customer", error);
      }
      throw toRepositoryError(error, "Failed to update customer");
    }
    return mapCustomer(data as Row);
  }
}
