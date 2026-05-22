"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

const clients = [
  { id: "1", name: "مؤسسة النخبة التجارية", email: "info@nokhba.sa", status: "active", expires: "2026-08-15" },
  { id: "2", name: "شركة الأمل للمقاولات", email: "contact@amal.sa", status: "active", expires: "2026-06-20" },
  { id: "3", name: "مكتب العتيبي", email: "office@otaibi.sa", status: "expired", expires: "2026-04-01" },
  { id: "4", name: "مورد الخدمات", email: "sales@logistics.sa", status: "suspended", expires: "2026-05-10" },
];

export default function AdminClientsPage() {
  return (
    <>
      <DashboardHeader title="إدارة العملاء" />
      <main className="p-4 lg:p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث عن عميل..." className="pr-10" />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">المنشأة</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">البريد</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">الانتهاء</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">{c.email}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        c.status === "active" ? "success" : c.status === "expired" ? "warning" : "destructive"
                      }
                    >
                      {c.status === "active" ? "نشط" : c.status === "expired" ? "منتهي" : "موقوف"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(c.expires)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">تفعيل</Button>
                      <Button variant="outline" size="sm">تمديد</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">إيقاف</Button>
                    </div>
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
