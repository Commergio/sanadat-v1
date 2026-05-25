"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  createForgotPasswordSchema,
} from "@/lib/validations";
import {
  getAuthErrorMessage,
  getSupabaseBrowserClient,
} from "@/lib/auth/client";
import { isSupabaseConfigured } from "@/lib/auth/errors";
import type { z } from "zod";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = createForgotPasswordSchema(tVal);
  type ForgotInput = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotInput) => {
    if (!isSupabaseConfigured()) {
      toast.error(t("authNotConfigured"));
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard/settings`,
        }
      );

      if (error) throw error;

      setSent(true);
      toast.success(t("resetSuccess"), {
        description: t("resetHint"),
        duration: 8000,
      });
    } catch (err) {
      toast.error(getAuthErrorMessage(err as Error, t));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-6">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {t("emailSent")}
          </p>
          <p className="text-sm mt-1 font-mono" dir="ltr">
            {getValues("email")}
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            {t("backToLogin")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? t("sending") : t("sendLink")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
