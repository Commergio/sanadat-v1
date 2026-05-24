"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations";
import {
  getAuthErrorMessage,
  getAuthRedirectUrl,
  getSupabaseBrowserClient,
} from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/auth/errors";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback") {
      toast.error("فشل تأكيد الحساب — حاول تسجيل الدخول مجدداً");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    if (!isSupabaseConfigured()) {
      toast.error("نظام المصادقة غير مُعدّ — تواصل مع الدعم");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (error) throw error;

      toast.success("تم تسجيل الدخول بنجاح");
      router.push(getAuthRedirectUrl("/ar/dashboard"));
      router.refresh();
    } catch (err) {
      toast.error(getAuthErrorMessage(err as Error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">كلمة المرور</Label>
          <Link
            href="/ar/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          className="text-left"
          disabled={loading}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "جاري الدخول..." : "تسجيل الدخول"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link href="/ar/register" className="text-primary font-medium hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
