import type { AuthError } from "@supabase/supabase-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  email_not_confirmed:
    "يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد",
  user_already_registered: "هذا البريد مسجّل مسبقاً — جرّب تسجيل الدخول",
  weak_password: "كلمة المرور ضعيفة — استخدم 8 أحرف على الأقل",
  over_email_send_rate_limit:
    "تم إرسال رسائل كثيرة — انتظر قليلاً ثم حاول مجدداً",
  same_password: "كلمة المرور الجديدة يجب أن تختلف عن القديمة",
  session_not_found: "انتهت الجلسة — سجّل الدخول مجدداً",
};

export function getAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) return "حدث خطأ غير متوقع";

  const authError = error as AuthError;
  const code = authError.code ?? authError.message;

  if (AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (authError.message?.includes("Invalid login credentials")) {
    return AUTH_ERROR_MESSAGES.invalid_credentials;
  }
  if (authError.message?.includes("already registered")) {
    return AUTH_ERROR_MESSAGES.user_already_registered;
  }
  if (authError.message?.includes("Email not confirmed")) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed;
  }

  return authError.message || "حدث خطأ — حاول مرة أخرى";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
