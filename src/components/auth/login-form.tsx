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
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      // Supabase auth integration point
      await new Promise((r) => setTimeout(r, 800));
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/ar/dashboard");
    } catch {
      toast.error("فشل تسجيل الدخول");
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
          placeholder="name@company.com"
          dir="ltr"
          className="text-left"
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
          dir="ltr"
          className="text-left"
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
