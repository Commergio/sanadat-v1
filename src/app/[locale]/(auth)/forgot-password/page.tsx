"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("تم إرسال رابط إعادة تعيين كلمة المرور");
    setLoading(false);
  };

  return (
    <AuthLayout
      title="نسيت كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" dir="ltr" className="text-left" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email?.message as string}</p>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "جاري الإرسال..." : "إرسال الرابط"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/ar/login" className="text-primary hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
