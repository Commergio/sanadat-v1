"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePaymentMethodLabel } from "@/hooks/use-translated-constants";
import { mockCompany, mockInvoice } from "@/lib/mock-data";
import { isRtlLocale } from "@/i18n/routing";

interface HeroA4InvoiceProps {
  className?: string;
}

export function HeroA4Invoice({ className }: HeroA4InvoiceProps) {
  const locale = useLocale();
  const t = useTranslations("documents");
  const tv = useTranslations("hero.visual");
  const isRtl = isRtlLocale(locale);
  const paymentLabel = usePaymentMethodLabel(mockInvoice.payment_method);
  const companyName =
    locale === "en" && mockCompany.name_en ? mockCompany.name_en : mockCompany.name;

  return (
    <div
      className={cn(
        "hero-paper relative w-[min(100%,320px)] aspect-[210/297] rounded-sm overflow-hidden text-slate-900",
        className
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Paper edge highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/90 via-transparent to-slate-100/40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" />

      <div className="relative flex h-full flex-col p-5 sm:p-6 text-[10px] leading-snug">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
              {tv("invoiceLabel")}
            </p>
            <h3 className="mt-1 text-[13px] font-bold text-slate-900 leading-tight">
              {t("invoice")}
            </h3>
            <p className="mt-0.5 font-mono text-[9px] text-slate-500">
              {mockInvoice.display_number}
            </p>
            <p className="mt-1 text-[9px] text-slate-500">
              {t("dateLabel")} {formatDate(mockInvoice.date, locale)}
            </p>
          </div>
          <div className="shrink-0 text-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50">
              <span className="text-[7px] font-bold text-indigo-700">SN</span>
            </div>
            <p className="mt-1.5 max-w-[88px] text-[9px] font-bold text-slate-900 leading-tight">
              {companyName}
            </p>
            {mockCompany.cr_number && (
              <p className="text-[7px] text-slate-500">
                {t("cr", { number: mockCompany.cr_number })}
              </p>
            )}
          </div>
        </div>

        {/* Party blocks */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
            <p className="text-[7px] font-medium uppercase tracking-wide text-slate-400">
              {t("client")}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-900">
              {mockInvoice.party_name}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
            <p className="text-[7px] font-medium uppercase tracking-wide text-slate-400">
              {t("paymentMethod")}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-900">{paymentLabel}</p>
          </div>
        </div>

        {/* Line items */}
        <table className="mt-3 w-full border-collapse text-[8px]">
          <thead>
            <tr className="border-b border-slate-900">
              <th className="py-1.5 text-start font-semibold">{t("itemDescription")}</th>
              <th className="w-8 py-1.5 text-center font-semibold">{t("quantity")}</th>
              <th className="w-14 py-1.5 text-end font-semibold">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {mockInvoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-1.5 pe-1 text-slate-800">{item.description}</td>
                <td className="py-1.5 text-center text-slate-600">{item.quantity}</td>
                <td className="py-1.5 text-end font-medium tabular-nums">
                  {formatCurrency(item.total, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between border-t-2 border-slate-900 pt-2">
            <span className="text-[10px] font-semibold">{t("totalAmount")}</span>
            <span className="text-[14px] font-bold tabular-nums text-indigo-600">
              {formatCurrency(mockInvoice.total, locale)}
            </span>
          </div>
          <p className="mt-1 text-end text-[8px] text-amber-700 font-medium">
            {t("unpaidStatus")}
          </p>

          {/* Signatures */}
          <div className="mt-4 flex justify-between gap-2 border-t border-slate-200 pt-3">
            <div className="flex-1 text-center">
              <div className="mx-auto h-7 border-b border-slate-300" />
              <p className="mt-1 text-[6px] text-slate-400">{t("signature")}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300">
                <span className="text-[5px] text-slate-400">{t("stamp")}</span>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="mx-auto h-7 border-b border-slate-300" />
              <p className="mt-1 text-[6px] text-slate-400">{t("accountant")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
