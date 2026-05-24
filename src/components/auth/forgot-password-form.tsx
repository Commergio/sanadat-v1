"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validations";
import {
  getAuthErrorMessage,
  getSupabaseBrowserClient,
} from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/auth/errors";
import type { z } from "zod";

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotInput) => {
    if (!isSupabaseConfigured()) {
      toast.error("نظام المصادقة غير مُعدّ — تواصل مع الدعم");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/ar/dashboard/settings`,
        }
      );

      if (error) throw error;

      setSent(true);
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور", {
        description: "تحقق من بريدك الإلكتروني (ومجلد الرسائل غير المرغوبة)",
        duration: 8000,
      });
    } catch (err) {
      toast.error(getAuthErrorMessage(err as Error));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-6">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            تم إرسال الرابط إلى
          </p>
          <p className="text-sm mt-1 font-mono" dir="ltr">
            {getValues("email")}
          </p>
        </div>
        <Link href="/ar/login">
          <Button variant="outline" className="w-full">
            العودة لتسجيل الدخول
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "جاري الإرسال..." : "إرسال الرابط"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/ar/login" className="text-primary hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
