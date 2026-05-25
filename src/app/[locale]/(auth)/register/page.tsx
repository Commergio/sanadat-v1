import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <AuthLayout title={t("register")} subtitle={t("registerSubtitle")}>
      <RegisterForm />
    </AuthLayout>
  );
}
