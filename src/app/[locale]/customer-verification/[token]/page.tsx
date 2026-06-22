"use client";

import { use, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureCanvas } from "@/components/shared/signature-canvas";
import { Logo } from "@/components/logo";

interface VerificationPayload {
  customer_id: string;
  company_name: string;
  customer_name: string;
  customer_phone: string;
  is_verified: boolean;
  token_valid: boolean;
  token_expired: boolean;
  token_used: boolean;
}

export default function CustomerVerificationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const locale = useLocale();
  const t = useTranslations("customerVerification");
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payload, setPayload] = useState<VerificationPayload | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer-verification/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorCode(data?.error?.code ?? "INTERNAL");
          setPayload(null);
          return;
        }
        setPayload(data as VerificationPayload);
        if (data.is_verified) setDone(true);
      } catch {
        setErrorCode("INTERNAL");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const handleApprove = async () => {
    const canvas = canvasContainerRef.current?.querySelector("canvas");
    if (!canvas) return;

    setSubmitting(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });
      if (!blob) {
        toast.error(t("signatureRequired"));
        return;
      }

      const form = new FormData();
      form.append("signature", blob, "signature.png");

      const res = await fetch(`/api/customer-verification/${encodeURIComponent(token)}/approve`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? t("approveFailed"));
        return;
      }
      setDone(true);
      toast.success(t("approveSuccess"));
    } catch {
      toast.error(t("approveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorCode === "NOT_FOUND" || !payload) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("invalidTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("invalidDesc")}</CardContent>
        </Card>
      </div>
    );
  }

  if (payload.token_expired) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("expiredTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("expiredDesc")}</CardContent>
        </Card>
      </div>
    );
  }

  if (done || payload.is_verified) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <div>
              <h1 className="text-lg font-bold">{t("verifiedTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("verifiedDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payload.token_used || !payload.token_valid) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("invalidTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("invalidDesc")}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-muted/30 px-4 py-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <Logo showText />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("subtitle", { company: payload.company_name })}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-3 rounded-lg bg-muted/40 p-4 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("customerName")}</dt>
                <dd className="font-medium">{payload.customer_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("customerPhone")}</dt>
                <dd className="font-medium tabular-nums" dir="ltr">
                  {payload.customer_phone}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("company")}</dt>
                <dd className="font-medium">{payload.company_name}</dd>
              </div>
            </dl>

            <p className="text-xs leading-relaxed text-muted-foreground">{t("terms")}</p>

            <div ref={canvasContainerRef}>
              <p className="mb-2 text-sm font-medium">{t("signatureLabel")}</p>
              <SignatureCanvas clearLabel={t("clearSignature")} onChange={setHasSignature} />
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={submitting || !hasSignature}
              onClick={() => void handleApprove()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("approve")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
