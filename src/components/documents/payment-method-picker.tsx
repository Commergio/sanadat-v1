"use client";

import { Banknote, Building2, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

const methods: {
  value: PaymentMethod;
  icon: typeof Banknote;
  labelKey: "cash" | "bank_transfer" | "pos";
  accent: string;
}[] = [
  {
    value: "cash",
    icon: Banknote,
    labelKey: "cash",
    accent: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  {
    value: "bank_transfer",
    icon: Building2,
    labelKey: "bank_transfer",
    accent: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    value: "pos",
    icon: CreditCard,
    labelKey: "pos",
    accent: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
];

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  const t = useTranslations("paymentMethods");

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {methods.map(({ value: method, icon: Icon, labelKey, accent }) => {
        const selected = value === method;
        return (
          <button
            key={method}
            type="button"
            onClick={() => onChange(method)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-center transition-all",
              selected
                ? cn(accent, "shadow-sm ring-2 ring-offset-2 ring-offset-background ring-current/20")
                : "border-border/80 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[11px] font-semibold leading-tight">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
