import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="إنشاء حساب جديد"
      subtitle="ابدأ رحلة رقمنة سندات منشأتك"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
