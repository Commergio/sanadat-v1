"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DOCUMENT_PREFIXES } from "@/lib/constants";
import type { DashboardStats } from "@/lib/types";

const typeRoutes = {
  receipt_voucher: "/ar/dashboard/receipts",
  payment_voucher: "/ar/dashboard/payments",
  invoice: "/ar/dashboard/invoices",
};

export function RecentDocuments({
  documents,
}: {
  documents: DashboardStats["recentDocuments"];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">آخر المستندات</CardTitle>
        <Link href="/ar/dashboard/receipts" className="text-xs text-primary hover:underline">
          عرض الكل
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`${typeRoutes[doc.type]}/${doc.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {DOCUMENT_PREFIXES[doc.type].charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.display_number}</p>
                  <p className="text-xs text-muted-foreground">{doc.party_name}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{formatCurrency(doc.amount)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(doc.date)}
                  </span>
                  {doc.status === "cancelled" && (
                    <Badge variant="destructive" className="text-[10px]">ملغى</Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
