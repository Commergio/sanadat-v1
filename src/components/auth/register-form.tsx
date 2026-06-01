"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { createRegisterSchema, type RegisterInput } from "@/lib/validations";
import {
  getAuthErrorMessage,
  getSupabaseBrowserClient,
} from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/env";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(createRegisterSchema(tVal)),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error(t("authNotConfigured"));
        return;
      }

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
          emailRedirectTo: `${origin}/auth/callback?next=/${locale}/onboarding`,
        },
      });

      if (error) throw error;

      if (signUpData.session) {
        toast.success(t("registerSuccess"));
        router.push("/onboarding");
        router.refresh();
        return;
      }

      toast.success(t("emailConfirmSent"), {
        description: t("emailConfirmHint"),
        duration: 8000,
      });
      router.push("/login");
    } catch (err) {
      toast.error(getAuthErrorMessage(err as Error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">{t("companyName")}</Label>
        <Input id="companyName" disabled={loading} {...register("companyName")} />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
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
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          placeholder="05xxxxxxxx"
          autoComplete="tel"
          dir="ltr"
          className="text-start"
          disabled={loading}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          className="text-start"
          disabled={loading}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          className="text-start"
          disabled={loading}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? t("creating") : t("createAccount")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{t("terms")}</p>

      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
