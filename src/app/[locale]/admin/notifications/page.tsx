import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminNotificationsPage() {
  return (
    <>
      <DashboardHeader title="الإشعارات" />
      <main className="p-4 lg:p-8 max-w-2xl space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">إرسال تنبيه انتهاء الاشتراك</h3>
            <p className="text-sm text-muted-foreground">
              يُرسل تلقائياً قبل 7 و 3 و 1 يوم من انتهاء الاشتراك
            </p>
            <Button>إرسال تنبيه يدوي</Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
