import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockInvoices = [
  { id: "1", display_number: "فاتورة-042", party_name: "مؤسسة البناء الحديث", amount: 28500, date: "2026-05-19", status: "active" as const, payment_status: "unpaid" as const },
  { id: "2", display_number: "فاتورة-041", party_name: "شركة التقنية", amount: 12000, date: "2026-05-12", status: "active" as const, payment_status: "paid" as const },
];

export default function InvoicesPage() {
  return (
    <>
      <DashboardHeader title="الفواتير" />
      <main className="flex-1 p-4 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." className="pr-10" />
          </div>
          <Link href="/ar/dashboard/invoices/new">
            <Button>+ فاتورة جديدة</Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الرقم</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">المبلغ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">السداد</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{inv.display_number}</td>
                  <td className="px-4 py-3">{inv.party_name}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.payment_status === "paid" ? "success" : "warning"}>
                      {inv.payment_status === "paid" ? "مسددة" : "غير مسددة"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/ar/dashboard/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm">عرض</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
