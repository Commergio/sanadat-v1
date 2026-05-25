import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthLayout title={t("forgotPassword")} subtitle={t("forgotSubtitle")}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
