import { DashboardHeader } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const subs = [
  { client: "مؤسسة النخبة", status: "active", expires: "2026-08-15", autoRenew: true },
  { client: "شركة الأمل", status: "active", expires: "2026-06-20", autoRenew: true },
  { client: "مكتب العتيبي", status: "expired", expires: "2026-04-01", autoRenew: false },
];

export default function AdminSubscriptionsPage() {
  return (
    <>
      <DashboardHeader title="الاشتراكات" />
      <main className="p-4 lg:p-8">
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">العميل</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">الحالة</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">الانتهاء</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">تجديد تلقائي</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.client}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "active" ? "success" : "warning"}>
                      {s.status === "active" ? "نشط" : "منتهي"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(s.expires)}</td>
                  <td className="px-4 py-3">{s.autoRenew ? "نعم" : "لا"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
