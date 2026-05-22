"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DOCUMENT_PREFIXES, PAYMENT_METHODS } from "@/lib/constants";
import type { DocumentType } from "@/lib/types";
import { mockReceipt, mockPayment, mockInvoice } from "@/lib/mock-data";

interface DocumentPreviewCardProps {
  type: DocumentType;
  scale?: number;
  className?: string;
}

const previews = {
  receipt_voucher: mockReceipt,
  payment_voucher: mockPayment,
  invoice: mockInvoice,
};

const titles = {
  receipt_voucher: "سند قبض",
  payment_voucher: "سند صرف",
  invoice: "فاتورة",
};

export function DocumentPreviewCard({
  type,
  scale = 0.5,
  className,
}: DocumentPreviewCardProps) {
  const doc = previews[type];
  const prefix = DOCUMENT_PREFIXES[type];

  return (
    <div
      className={cn("origin-top-right", className)}
      style={{ transform: `scale(${scale})` }}
    >
      <div className="a4-document rounded-sm p-8 text-right" style={{ width: 210, minHeight: 297 }}>
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <p className="text-[8px] text-gray-400 uppercase tracking-wider">نظام السندات</p>
            <h2 className="text-sm font-bold text-gray-900 mt-1">{titles[type]}</h2>
            <p className="text-[9px] text-gray-500 mt-0.5">{doc.display_number}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <span className="text-[8px] font-bold text-indigo-600">شعار</span>
          </div>
        </div>

        <div className="space-y-3 text-[9px] text-gray-600">
          <div className="flex justify-between">
            <span>التاريخ</span>
            <span className="font-medium text-gray-900">{formatDate(doc.date)}</span>
          </div>
          <div className="flex justify-between">
            <span>{type === "invoice" ? "العميل" : "الطرف"}</span>
            <span className="font-medium text-gray-900">{doc.party_name}</span>
          </div>
          <div className="flex justify-between">
            <span>طريقة الدفع</span>
            <span className="font-medium text-gray-900">
              {PAYMENT_METHODS[doc.payment_method]}
            </span>
          </div>
        </div>

        {type === "invoice" && "items" in doc && (
          <div className="mt-4 border border-gray-100 rounded">
            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-2 text-[7px] font-medium text-gray-500">
              <span>الوصف</span>
              <span className="text-center">الكمية</span>
              <span className="text-left">المبلغ</span>
            </div>
            {doc.items.slice(0, 2).map((item) => (
              <div key={item.id} className="grid grid-cols-3 gap-1 p-2 text-[7px] border-t border-gray-50">
                <span className="truncate">{item.description}</span>
                <span className="text-center">{item.quantity}</span>
                <span className="text-left">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-gray-500">المبلغ</span>
            <span className="text-base font-bold text-indigo-600">
              {formatCurrency(doc.amount)}
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
          <div className="text-center">
            <div className="h-8 w-20 border border-dashed border-gray-200 rounded mb-1" />
            <p className="text-[6px] text-gray-400">التوقيع</p>
          </div>
          <div className="text-center">
            <div className="h-8 w-8 rounded-full border border-dashed border-gray-200 mb-1" />
            <p className="text-[6px] text-gray-400">الختم</p>
          </div>
        </div>

        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-[5px] text-indigo-200 tracking-widest">نظام السندات — sanadat.sa</p>
        </div>
      </div>
    </div>
  );
}
