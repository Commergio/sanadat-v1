"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { APP_NAME, PAYMENT_METHODS } from "@/lib/constants";
import type { ReceiptVoucher, PaymentVoucher, Invoice } from "@/lib/types";
import { mockCompany } from "@/lib/mock-data";

type DocumentData = ReceiptVoucher | PaymentVoucher | Invoice;

interface A4DocumentProps {
  document: DocumentData;
  title: string;
  className?: string;
}

export function A4Document({ document, title, className }: A4DocumentProps) {
  const company = mockCompany;
  const isInvoice = document.type === "invoice";
  const invoice = isInvoice ? (document as Invoice) : null;

  return (
    <div className={cn("print-area", className)}>
      <div className="a4-document mx-auto p-12 text-gray-900" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">رقم: {document.display_number}</p>
            <p className="text-sm text-gray-500">التاريخ: {formatDate(document.date)}</p>
            {document.status === "cancelled" && (
              <div className="mt-2 inline-block rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 border border-red-200">
                ملغى — {document.cancel_reason}
              </div>
            )}
          </div>
          <div className="text-left">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt="شعار" className="h-16 w-auto" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <span className="text-xs font-bold text-indigo-600">الشعار</span>
              </div>
            )}
            <p className="text-sm font-bold mt-2">{company.name}</p>
            {company.cr_number && (
              <p className="text-xs text-gray-500">س.ت: {company.cr_number}</p>
            )}
          </div>
        </div>

        {/* Party info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-1">
              {isInvoice ? "العميل" : "الطرف"}
            </p>
            <p className="font-semibold">{document.party_name}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-1">طريقة الدفع</p>
            <p className="font-semibold">
              {PAYMENT_METHODS[document.payment_method]}
            </p>
            {document.bank_name && (
              <p className="text-xs text-gray-500 mt-1">البنك: {document.bank_name}</p>
            )}
            {document.transfer_number && (
              <p className="text-xs text-gray-500">رقم التحويل: {document.transfer_number}</p>
            )}
            {document.reference_number && (
              <p className="text-xs text-gray-500">المرجع: {document.reference_number}</p>
            )}
          </div>
        </div>

        {/* Invoice items */}
        {invoice && (
          <table className="w-full mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 text-right font-semibold">الوصف</th>
                <th className="py-3 text-center font-semibold w-20">الكمية</th>
                <th className="py-3 text-center font-semibold w-28">سعر الوحدة</th>
                <th className="py-3 text-left font-semibold w-28">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-center">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-left font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Description */}
        {document.description && (
          <div className="mb-8 rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">البيان</p>
            <p className="text-sm">{document.description}</p>
          </div>
        )}

        {/* Amount */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2">
            {invoice && invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الخصم</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-gray-900 pt-3">
              <span className="font-semibold">المبلغ الإجمالي</span>
              <span className="text-2xl font-bold text-indigo-600">
                {formatCurrency(document.amount)}
              </span>
            </div>
            {invoice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">حالة السداد</span>
                <span className={invoice.payment_status === "paid" ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                  {invoice.payment_status === "paid" ? "مسددة" : invoice.payment_status === "partial" ? "مسددة جزئياً" : "غير مسددة"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Signature area */}
        <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-200">
          <div className="text-center w-40">
            <div className="h-16 border-b border-gray-400 mb-2" />
            <p className="text-xs text-gray-500">المستلم / التوقيع</p>
          </div>
          <div className="text-center w-32">
            <div className="h-20 w-20 mx-auto rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              <span className="text-xs text-gray-400">الختم</span>
            </div>
            <p className="text-xs text-gray-500">ختم المنشأة</p>
          </div>
          <div className="text-center w-40">
            <div className="h-16 border-b border-gray-400 mb-2" />
            <p className="text-xs text-gray-500">المحاسب / التوقيع</p>
          </div>
        </div>

        {/* QR placeholder + footer */}
        <div className="mt-8 flex items-end justify-between">
          <div className="h-16 w-16 border border-gray-200 rounded flex items-center justify-center">
            <span className="text-[8px] text-gray-400 text-center leading-tight">QR<br/>مستقبلي</span>
          </div>
          <div className="text-left text-xs text-gray-400">
            <p>{company.address}</p>
            <p>{company.phone} | {company.email}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-indigo-300 tracking-widest">{APP_NAME} — sanadat.sa</p>
        </div>
      </div>
    </div>
  );
}
