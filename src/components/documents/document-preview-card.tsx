"use client";

import { useTranslations } from "next-intl";
import { A4Document } from "@/components/documents/a4-document";
import { ResponsiveA4Scale } from "@/components/documents/responsive-a4-scale";
import { getDocumentConfig } from "@/components/documents/engine";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/lib/types";
import { mockInvoice, mockPayment, mockReceipt } from "@/lib/mock-data";

interface DocumentPreviewCardProps {
  type: DocumentType;
  scale?: number;
  className?: string;
}

const previews = {
  receipt_voucher: mockReceipt,
  payment_voucher: mockPayment,
  invoice: mockInvoice,
} as const;

/** Scaled A4 preview for marketing/auth — uses shared `A4Document` renderer. */
export function DocumentPreviewCard({
  type,
  scale = 0.7,
  className,
}: DocumentPreviewCardProps) {
  const t = useTranslations("documents");
  const doc = previews[type];
  const config = getDocumentConfig(type);

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <ResponsiveA4Scale maxScale={scale} padding={0}>
        <A4Document document={doc} title={t(config.titleKey)} />
      </ResponsiveA4Scale>
    </div>
  );
}
