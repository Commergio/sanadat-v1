"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { createLoginSchema, type LoginInput } from "@/lib/validations";
import {
  getAuthErrorMessage,
  getSupabaseBrowserClient,
  useAuthRedirectUrl,
} from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/auth/errors";

export function LoginForm() {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const redirectUrl = useAuthRedirectUrl("/dashboard");

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback") {
      toast.error(t("callbackError"));
    }
  }, [searchParams, t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(tVal)),
  });

  const onSubmit = async (data: LoginInput) => {
    if (!isSupabaseConfigured()) {
      toast.error(t("authNotConfigured"));
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

      toast.success(t("loginSuccess"));
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      toast.error(getAuthErrorMessage(err as Error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          dir="ltr"
          className="text-start"
          disabled={loading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          className="text-start"
          disabled={loading}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? t("signingIn") : t("signIn")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          {t("register")}
        </Link>
      </p>
    </form>
  );
}
