"use client";

import { useCallback, useEffect, useState } from "react";
import type { Customer } from "@/lib/types";

export function useCustomers(search?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search?.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to load customers");
      }
      setCustomers(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCustomers();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCustomers, search]);

  return { customers, loading, error, refresh: fetchCustomers };
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? "Failed to load customer");
  }
  return data as Customer;
}

export async function createCustomer(payload: {
  name: string;
  phone: string;
  email?: string;
  nationalId?: string;
}): Promise<Customer> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      nationalId: payload.nationalId || null,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? "Failed to create customer");
  }
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  payload: {
    name?: string;
    phone?: string;
    email?: string | null;
    nationalId?: string | null;
  }
): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      nationalId: payload.nationalId,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? "Failed to update customer");
  }
  return data as Customer;
}
