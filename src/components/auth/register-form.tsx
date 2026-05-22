"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (_data: RegisterInput) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("تم إنشاء الحساب بنجاح");
      router.push("/ar/onboarding");
    } catch {
      toast.error("فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">اسم المنشأة</Label>
        <Input id="companyName" placeholder="مؤسسة النخبة التجارية" {...register("companyName")} />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" dir="ltr" className="text-left" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">رقم الجوال</Label>
        <Input id="phone" placeholder="05xxxxxxxx" dir="ltr" className="text-left" {...register("phone")} />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" type="password" dir="ltr" className="text-left" {...register("password")} />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
        <Input id="confirmPassword" type="password" dir="ltr" className="text-left" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link href="/ar/login" className="text-primary font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
