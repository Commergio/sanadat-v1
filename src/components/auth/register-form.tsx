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
import {
  getAuthErrorMessage,
  getSupabaseBrowserClient,
} from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/auth/errors";

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

  const onSubmit = async (data: RegisterInput) => {
    if (!isSupabaseConfigured()) {
      toast.error("نظام المصادقة غير مُعدّ — تواصل مع الدعم");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            company_name: data.companyName.trim(),
            phone: data.phone.trim(),
          },
          emailRedirectTo: `${origin}/auth/callback?next=/ar/onboarding`,
        },
      });

      if (error) throw error;

      if (signUpData.session) {
        toast.success("تم إنشاء الحساب بنجاح");
        router.push("/ar/onboarding");
        router.refresh();
        return;
      }

      toast.success("تم إرسال رابط التأكيد إلى بريدك الإلكتروني", {
        description: "افتح البريد واضغط على الرابط لتفعيل حسابك",
        duration: 8000,
      });
      router.push("/ar/login");
    } catch (err) {
      toast.error(getAuthErrorMessage(err as Error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">اسم المنشأة</Label>
        <Input
          id="companyName"
          placeholder="مؤسسة النخبة التجارية"
          disabled={loading}
          {...register("companyName")}
        />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className="text-left"
          disabled={loading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">رقم الجوال</Label>
        <Input
          id="phone"
          placeholder="05xxxxxxxx"
          autoComplete="tel"
          dir="ltr"
          className="text-left"
          disabled={loading}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          className="text-left"
          disabled={loading}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          className="text-left"
          disabled={loading}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        بالتسجيل أنت توافق على شروط الاستخدام وسياسة الخصوصية
      </p>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link href="/ar/login" className="text-primary font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
