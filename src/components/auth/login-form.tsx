"use client";

import { useState, useEffect, type FormEvent } from "react";
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
import { isSupabaseConfigured } from "@/lib/env";
import {
  handleAutofillAnimation,
  mergeInputRefs,
  syncFormFieldsFromDom,
} from "@/lib/forms/autofill-sync";

const LOGIN_EMAIL_ID = "login-email";
const LOGIN_PASSWORD_ID = "login-password";

export function LoginForm() {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const redirectUrl = useAuthRedirectUrl("/dashboard");

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (message === "email-confirmed-login-required") {
      toast.success(t("emailConfirmedLoginRequired"));
    } else if (error === "auth_callback") {
      toast.error(t("callbackError"));
    } else if (error === "supabase_not_configured") {
      toast.error(t("authNotConfigured"));
    }
  }, [searchParams, t]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(tVal)),
    shouldUseNativeValidation: false,
  });

  const emailField = register("email");
  const passwordField = register("password");

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error(t("authNotConfigured"));
        return;
      }

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

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    syncFormFieldsFromDom(setValue, [
      { name: "email", elementId: LOGIN_EMAIL_ID },
      { name: "password", elementId: LOGIN_PASSWORD_ID },
    ]);
    void handleSubmit(onSubmit)(event);
  };

  return (
    <form noValidate onSubmit={handleFormSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={LOGIN_EMAIL_ID}>{t("email")}</Label>
        <Input
          id={LOGIN_EMAIL_ID}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@company.com"
          dir="ltr"
          className="text-start"
          disabled={loading}
          onAnimationStart={handleAutofillAnimation(setValue, "email")}
          onInput={(event) => {
            setValue("email", event.currentTarget.value, { shouldDirty: true, shouldValidate: false });
          }}
          {...emailField}
          ref={mergeInputRefs(emailField.ref)}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={LOGIN_PASSWORD_ID}>{t("password")}</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <Input
          id={LOGIN_PASSWORD_ID}
          name="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          className="text-start"
          disabled={loading}
          onAnimationStart={handleAutofillAnimation(setValue, "password")}
          onInput={(event) => {
            setValue("password", event.currentTarget.value, { shouldDirty: true, shouldValidate: false });
          }}
          {...passwordField}
          ref={mergeInputRefs(passwordField.ref)}
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
