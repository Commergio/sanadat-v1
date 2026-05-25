"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  useDocumentTypeLabel,
  usePaymentMethodLabel,
} from "@/hooks/use-translated-constants";
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

export function DocumentPreviewCard({
  type,
  scale = 0.5,
  className,
}: DocumentPreviewCardProps) {
  const locale = useLocale();
  const t = useTranslations("documents");
  const tApp = useTranslations("app");
  const doc = previews[type];
  const title = useDocumentTypeLabel(type);
  const paymentLabel = usePaymentMethodLabel(doc.payment_method);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      className={cn("origin-top-right", className)}
      style={{ transform: `scale(${scale})` }}
    >
      <div
        className="a4-document rounded-sm p-8"
        style={{ width: 210, minHeight: 297, direction: dir }}
      >
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <p className="text-[8px] text-gray-400 uppercase tracking-wider">{tApp("name")}</p>
            <h2 className="text-sm font-bold text-gray-900 mt-1">{title}</h2>
            <p className="text-[9px] text-gray-500 mt-0.5">{doc.display_number}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <span className="text-[8px] font-bold text-indigo-600">{t("logoPlaceholder")}</span>
          </div>
        </div>

        <div className="space-y-3 text-[9px] text-gray-600">
          <div className="flex justify-between">
            <span>{t("date")}</span>
            <span className="font-medium text-gray-900">{formatDate(doc.date, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span>{type === "invoice" ? t("client") : t("party")}</span>
            <span className="font-medium text-gray-900">{doc.party_name}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("paymentMethod")}</span>
            <span className="font-medium text-gray-900">{paymentLabel}</span>
          </div>
        </div>

        {type === "invoice" && "items" in doc && (
          <div className="mt-4 border border-gray-100 rounded">
            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-2 text-[7px] font-medium text-gray-500">
              <span>{t("itemDescription")}</span>
              <span className="text-center">{t("quantity")}</span>
              <span className="text-end">{t("amountLabel")}</span>
            </div>
            {doc.items.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 gap-1 p-2 text-[7px] border-t border-gray-50"
              >
                <span className="truncate">{item.description}</span>
                <span className="text-center">{item.quantity}</span>
                <span className="text-end">{formatCurrency(item.total, locale)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-gray-500">{t("amountLabel")}</span>
            <span className="text-base font-bold text-indigo-600">
              {formatCurrency(doc.amount, locale)}
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
          <div className="text-center">
            <div className="h-8 w-20 border border-dashed border-gray-200 rounded mb-1" />
            <p className="text-[6px] text-gray-400">{t("signatureShort")}</p>
          </div>
          <div className="text-center">
            <div className="h-8 w-8 rounded-full border border-dashed border-gray-200 mb-1" />
            <p className="text-[6px] text-gray-400">{t("stampShort")}</p>
          </div>
        </div>

        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-[5px] text-indigo-200 tracking-widest">{t("watermark")}</p>
        </div>
      </div>
    </div>
  );
}
