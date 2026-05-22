import { DashboardHeader } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_GATEWAYS } from "@/lib/constants";

const payments = [
  { id: "1", client: "مؤسسة النخبة", gateway: "moyasar" as const, amount: 399, status: "completed", date: "2026-05-01" },
  { id: "2", client: "شركة الأمل", gateway: "hyperpay" as const, amount: 399, status: "completed", date: "2026-05-18" },
  { id: "3", client: "مكتب العتيبي", gateway: "stc_pay" as const, amount: 399, status: "pending", date: "2026-05-20" },
];

export default function AdminPaymentsPage() {
  return (
    <>
      <DashboardHeader title="المدفوعات" />
      <main className="p-4 lg:p-8">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">العميل</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">البوابة</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">المبلغ</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">الحالة</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.client}</td>
                  <td className="px-4 py-3">{PAYMENT_GATEWAYS[p.gateway]}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "completed" ? "success" : "warning"}>
                      {p.status === "completed" ? "مكتمل" : "معلق"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
