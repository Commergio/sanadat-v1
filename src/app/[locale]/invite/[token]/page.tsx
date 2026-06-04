"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [resolved, setResolved] = useState(false);

  const s = useMemo(
    () =>
      isAr
        ? {
            title: "قبول دعوة الفريق",
            subtitle: "سيتم ربط حسابك بالشركة بعد قبول الدعوة.",
            loginFirst: "يجب تسجيل الدخول أو إنشاء حساب أولاً لقبول الدعوة.",
            goLogin: "تسجيل الدخول",
            goRegister: "إنشاء حساب",
            accept: "قبول الدعوة",
            accepting: "جاري القبول...",
            failed: "فشل قبول الدعوة",
            success: "تم قبول الدعوة بنجاح",
            expired: "انتهت صلاحية الدعوة",
            alreadyAccepted: "تم قبول هذه الدعوة مسبقاً",
            emailMismatch: "البريد المسجّل لا يطابق بريد الدعوة",
            invalidToken: "رابط الدعوة غير صالح أو مستخدم مسبقاً",
            switchCompanyFailed: "تم القبول لكن تعذّر تفعيل الشركة — اخترها من الإعدادات",
          }
        : {
            title: "Accept Team Invitation",
            subtitle: "Your account will be linked to the company after acceptance.",
            loginFirst: "Please login or register first to accept this invitation.",
            goLogin: "Login",
            goRegister: "Register",
            accept: "Accept Invitation",
            accepting: "Accepting...",
            failed: "Failed to accept invitation",
            success: "Invitation accepted successfully",
            expired: "This invitation has expired",
            alreadyAccepted: "This invitation was already accepted",
            emailMismatch: "Your account email does not match the invitation email",
            invalidToken: "Invalid or already used invitation link",
            switchCompanyFailed:
              "Invitation accepted, but switching company failed — select it in settings",
          },
    [isAr]
  );

  const inviteRedirect = `/invite/${token}`;

  const resolveAcceptError = (code?: string, message?: string) => {
    if (code === "EXPIRED_INVITATION") return s.expired;
    if (code === "ALREADY_ACCEPTED") return s.alreadyAccepted;
    if (code === "FORBIDDEN") return s.emailMismatch;
    if (code === "NOT_FOUND") return s.invalidToken;
    return message || s.failed;
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setLoggedIn(Boolean(user));
      } finally {
        setLoading(false);
      }
    }
    void checkAuth();
  }, []);

  const onAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/team/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(resolveAcceptError(payload?.error?.code, payload?.error?.message));
        return;
      }

      const companyId = payload?.companyId as string | undefined;
      if (companyId) {
        const switchRes = await fetch("/api/tenant/active-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId }),
        });
        if (!switchRes.ok) {
          toast.error(s.switchCompanyFailed);
        }
      }

      toast.success(s.success);
      setResolved(true);
      router.push("/dashboard");
    } catch {
      toast.error(s.failed);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{s.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">...</p>
          ) : !loggedIn ? (
            <>
              <p className="text-sm text-muted-foreground">{s.loginFirst}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    router.push(`/login?redirect=/${locale}${inviteRedirect}`)
                  }
                >
                  {s.goLogin}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/register?redirect=/${locale}${inviteRedirect}`)
                  }
                >
                  {s.goRegister}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => void onAccept()} disabled={accepting || resolved || !token}>
                {accepting ? s.accepting : s.accept}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
