import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const templates = [
  { name: "إرسال سند قبض", body: "مرحباً {{name}}، مرفق سند قبض رقم {{number}} بمبلغ {{amount}} ر.س" },
  { name: "تذكير اشتراك", body: "تنبيه: ينتهي اشتراكك في نظام السندات خلال {{days}} أيام" },
];

export default function AdminWhatsappPage() {
  return (
    <>
      <DashboardHeader title="قوالب واتساب" />
      <main className="p-4 lg:p-8 space-y-4 max-w-2xl">
        {templates.map((t) => (
          <Card key={t.name}>
            <CardHeader>
              <CardTitle className="text-base">{t.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">{t.body}</p>
              <Button variant="outline" size="sm" className="mt-4">تعديل</Button>
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
