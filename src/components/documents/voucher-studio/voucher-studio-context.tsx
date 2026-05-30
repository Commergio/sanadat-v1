"use client";

import { createContext, useContext } from "react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormHandleSubmit,
  UseFormWatch,
} from "react-hook-form";
import type { VoucherStudioConfig } from "@/components/documents/voucher-studio/config";
import type { PaymentMethod } from "@/lib/types";
import type { z } from "zod";
import type { createDocumentBaseSchema } from "@/lib/validations";

export type VoucherStudioFormData = z.infer<
  ReturnType<typeof createDocumentBaseSchema>
>;

export type StudioViewMode = "edit" | "preview";

export interface VoucherStudioContextValue {
  config: VoucherStudioConfig;
  displayNum: string;
  number: number;
  register: UseFormRegister<VoucherStudioFormData>;
  control: Control<VoucherStudioFormData>;
  handleSubmit: ReturnType<UseFormHandleSubmit<VoucherStudioFormData>>;
  watch: UseFormWatch<VoucherStudioFormData>;
  errors: FieldErrors<VoucherStudioFormData>;
  fieldValid: (name: keyof VoucherStudioFormData) => boolean;
  paymentMethod: PaymentMethod;
  loading: boolean;
  viewMode: StudioViewMode;
  setViewMode: (mode: StudioViewMode) => void;
}

const VoucherStudioContext = createContext<VoucherStudioContextValue | null>(null);

export function VoucherStudioProvider({
  value,
  children,
}: {
  value: VoucherStudioContextValue;
  children: React.ReactNode;
}) {
  return (
    <VoucherStudioContext.Provider value={value}>{children}</VoucherStudioContext.Provider>
  );
}

export function useVoucherStudio() {
  const ctx = useContext(VoucherStudioContext);
  if (!ctx) {
    throw new Error("useVoucherStudio must be used within VoucherStudioProvider");
  }
  return ctx;
}
