"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";

export interface DocumentRow {
  id: string;
  display_number: string;
  party_name: string;
  amount: number;
  date: string;
  status: "active" | "cancelled";
  payment_method: keyof typeof PAYMENT_METHODS;
}

interface DocumentsTableProps {
  documents: DocumentRow[];
  basePath: string;
  createHref: string;
  createLabel: string;
}

export function DocumentsTable({
  documents,
  basePath,
  createHref,
  createLabel,
}: DocumentsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = documents.filter(
    (d) =>
      d.party_name.includes(search) ||
      d.display_number.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالرقم أو الاسم..."
            className="pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            تصفية
          </Button>
          <Link href={createHref}>
            <Button size="sm">{createLabel}</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الرقم</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الطرف</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">المبلغ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الدفع</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد مستندات
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{doc.display_number}</td>
                    <td className="px-4 py-3">{doc.party_name}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(doc.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {PAYMENT_METHODS[doc.payment_method]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={doc.status === "active" ? "success" : "destructive"}>
                        {doc.status === "active" ? "نشط" : "ملغى"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`${basePath}/${doc.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
