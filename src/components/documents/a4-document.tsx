"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePaymentMethodLabel } from "@/hooks/use-translated-constants";
import type { ReceiptVoucher, PaymentVoucher, Invoice, Company } from "@/lib/types";
import { useCompany } from "@/hooks/use-company";
import { mockCompany } from "@/lib/mock-data";

type DocumentData = ReceiptVoucher | PaymentVoucher | Invoice;

interface A4DocumentProps {
  document: DocumentData;
  title: string;
  className?: string;
  company?: Company;
}

export function A4Document({ document, title, className, company: companyProp }: A4DocumentProps) {
  const locale = useLocale();
  const t = useTranslations("documents");
  const { company: storeCompany } = useCompany();
  const company = companyProp ?? storeCompany ?? (mockCompany as unknown as Company);
  const isInvoice = document.type === "invoice";
  const invoice = isInvoice ? (document as Invoice) : null;
  const paymentLabel = usePaymentMethodLabel(document.payment_method);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className={cn("print-area", className)}>
      <div className="a4-document mx-auto p-12 text-gray-900" dir={dir}>
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("numberLabel")} {document.display_number}
            </p>
            <p className="text-sm text-gray-500">
              {t("dateLabel")} {formatDate(document.date, locale)}
            </p>
            {document.status === "cancelled" && (
              <div className="mt-2 inline-block rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 border border-red-200">
                {t("cancelled", { reason: document.cancel_reason ?? "" })}
              </div>
            )}
          </div>
          <div className={locale === "ar" ? "text-left" : "text-right"}>
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt={t("logoPlaceholder")} className="h-16 w-auto" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <span className="text-xs font-bold text-indigo-600">{t("logoPlaceholder")}</span>
              </div>
            )}
            <p className="text-sm font-bold mt-2">{company.name}</p>
            {company.cr_number && (
              <p className="text-xs text-gray-500">{t("cr", { number: company.cr_number })}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-1">
              {isInvoice ? t("client") : t("party")}
            </p>
            <p className="font-semibold">{document.party_name}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-1">{t("paymentMethod")}</p>
            <p className="font-semibold">{paymentLabel}</p>
            {document.bank_name && (
              <p className="text-xs text-gray-500 mt-1">
                {t("bankLabel")} {document.bank_name}
              </p>
            )}
            {document.transfer_number && (
              <p className="text-xs text-gray-500">
                {t("transferLabel")} {document.transfer_number}
              </p>
            )}
            {document.reference_number && (
              <p className="text-xs text-gray-500">
                {t("referenceLabel")} {document.reference_number}
              </p>
            )}
          </div>
        </div>

        {invoice && (
          <table className="w-full mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 font-semibold text-start">{t("itemDescription")}</th>
                <th className="py-3 text-center font-semibold w-20">{t("quantity")}</th>
                <th className="py-3 text-center font-semibold w-28">{t("unitPrice")}</th>
                <th className="py-3 font-semibold w-28 text-end">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-center">{formatCurrency(item.unit_price, locale)}</td>
                  <td className="py-3 text-end font-medium">{formatCurrency(item.total, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {document.description && (
          <div className="mb-8 rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{t("statement")}</p>
            <p className="text-sm">{document.description}</p>
          </div>
        )}

        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2">
            {invoice && invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("discount")}</span>
                <span>-{formatCurrency(invoice.discount, locale)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-gray-900 pt-3">
              <span className="font-semibold">{t("totalAmount")}</span>
              <span className="text-2xl font-bold text-indigo-600">
                {formatCurrency(document.amount, locale)}
              </span>
            </div>
            {invoice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("paymentStatusLabel")}</span>
                <span
                  className={
                    invoice.payment_status === "paid"
                      ? "text-emerald-600 font-medium"
                      : "text-amber-600 font-medium"
                  }
                >
                  {invoice.payment_status === "paid"
                    ? t("paidStatus")
                    : invoice.payment_status === "partial"
                      ? t("partialStatus")
                      : t("unpaidStatus")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-200">
          <div className="text-center w-40">
            <div className="h-16 border-b border-gray-400 mb-2" />
            <p className="text-xs text-gray-500">{t("signature")}</p>
          </div>
          <div className="text-center w-32">
            <div className="h-20 w-20 mx-auto rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              <span className="text-xs text-gray-400">{t("stamp")}</span>
            </div>
            <p className="text-xs text-gray-500">{t("stamp")}</p>
          </div>
          <div className="text-center w-40">
            <div className="h-16 border-b border-gray-400 mb-2" />
            <p className="text-xs text-gray-500">{t("accountant")}</p>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div className="h-16 w-16 border border-gray-200 rounded flex items-center justify-center">
            <span className="text-[8px] text-gray-400 text-center leading-tight whitespace-pre-line">
              {t("qrFuture")}
            </span>
          </div>
          <div className={`text-xs text-gray-400 ${locale === "ar" ? "text-left" : "text-right"}`}>
            <p>{company.address}</p>
            <p>
              {company.phone} | {company.email}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-indigo-300 tracking-widest">{t("watermark")}</p>
        </div>
      </div>
    </div>
  );
}
