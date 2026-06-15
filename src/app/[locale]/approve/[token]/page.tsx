"use client";

import { use, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SignatureCanvas } from "@/components/shared/signature-canvas";
import { Logo } from "@/components/logo";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePaymentMethodLabel } from "@/hooks/use-translated-constants";
import type { PaymentMethod } from "@/lib/types";

interface ApprovalSnapshot {
  date: string;
  amount: number;
  party_name: string;
  description: string | null;
  payment_method: PaymentMethod;
  transfer_number: string | null;
  bank_name: string | null;
  reference_number: string | null;
}

interface ApprovalPayload {
  receipt_id: string;
  company_name: string;
  company_name_en: string | null;
  company_phone: string | null;
  company_cr_number: string | null;
  company_vat_number: string | null;
  company_address: string | null;
  customer_name: string;
  customer_phone: string;
  customer_verified: boolean;
  customer_signature_url: string | null;
  lifecycle_status: string;
  snapshot: ApprovalSnapshot;
  token_valid: boolean;
  token_expired: boolean;
  token_used: boolean;
}

export default function ReceiptApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const locale = useLocale();
  const t = useTranslations("receiptApprovalPublic");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [payload, setPayload] = useState<ApprovalPayload | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [useExisting, setUseExisting] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const paymentLabel = usePaymentMethodLabel(payload?.snapshot.payment_method ?? "cash");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/approvals/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorCode(data?.error?.code ?? "INTERNAL");
          setPayload(null);
          return;
        }
        const p = data as ApprovalPayload;
        setPayload(p);
        if (p.customer_verified && p.customer_signature_url) {
          setUseExisting(true);
        }
        if (p.lifecycle_status === "issued") setDone("approved");
        if (p.lifecycle_status === "rejected") setDone("rejected");
      } catch {
        setErrorCode("INTERNAL");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const handleApprove = async () => {
    if (!payload) return;
    setSubmitting(true);
    try {
      if (useExisting && payload.customer_signature_url) {
        const res = await fetch(`/api/approvals/${encodeURIComponent(token)}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            use_existing_signature: true,
            approved_by_name: payload.customer_name,
            approved_by_phone: payload.customer_phone,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data?.error?.message ?? t("approveFailed"));
          return;
        }
        setDone("approved");
        toast.success(t("approveSuccess"));
        return;
      }

      const canvas = canvasContainerRef.current?.querySelector("canvas");
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });
      if (!blob) {
        toast.error(t("signatureRequired"));
        return;
      }

      const form = new FormData();
      form.append("signature", blob, "signature.png");
      form.append("approved_by_name", payload.customer_name);
      form.append("approved_by_phone", payload.customer_phone);

      const res = await fetch(`/api/approvals/${encodeURIComponent(token)}/approve`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? t("approveFailed"));
        return;
      }
      setDone("approved");
      toast.success(t("approveSuccess"));
    } catch {
      toast.error(t("approveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      toast.error(t("rejectReasonRequired"));
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(`/api/approvals/${encodeURIComponent(token)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? t("rejectFailed"));
        return;
      }
      setDone("rejected");
      toast.success(t("rejectSuccess"));
    } catch {
      toast.error(t("rejectFailed"));
    } finally {
      setRejecting(false);
    }
  };

  const dir = locale === "ar" ? "rtl" : "ltr";

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorCode === "NOT_FOUND" || !payload) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={dir}>
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={dir}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("expiredTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("expiredDesc")}</CardContent>
        </Card>
      </div>
    );
  }

  if (done === "approved" || payload.token_used || payload.lifecycle_status === "issued") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={dir}>
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <div>
              <h1 className="text-lg font-bold">{t("approvedTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("approvedDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done === "rejected" || payload.lifecycle_status === "rejected") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={dir}>
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <XCircle className="h-14 w-14 text-destructive" />
            <div>
              <h1 className="text-lg font-bold">{t("rejectedTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("rejectedDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payload.token_valid) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4" dir={dir}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("invalidTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t("invalidDesc")}</CardContent>
        </Card>
      </div>
    );
  }

  const snap = payload.snapshot;
  const companyDisplay =
    locale === "en" && payload.company_name_en ? payload.company_name_en : payload.company_name;

  return (
    <div className="min-h-[100dvh] bg-muted/30 px-4 py-8" dir={dir}>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <Logo showText />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("subtitle", { company: companyDisplay })}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-3 rounded-lg bg-muted/40 p-4 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("customerName")}</dt>
                <dd className="font-medium">{payload.customer_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("amount")}</dt>
                <dd className="font-bold tabular-nums">{formatCurrency(snap.amount, locale)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("date")}</dt>
                <dd className="font-medium">{formatDate(snap.date, locale)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("paymentMethod")}</dt>
                <dd className="font-medium">{paymentLabel}</dd>
              </div>
              {snap.description ? (
                <div>
                  <dt className="text-muted-foreground">{t("description")}</dt>
                  <dd className="font-medium">{snap.description}</dd>
                </div>
              ) : null}
              {payload.company_cr_number ? (
                <div>
                  <dt className="text-muted-foreground">{t("crNumber")}</dt>
                  <dd className="font-medium tabular-nums" dir="ltr">
                    {payload.company_cr_number}
                  </dd>
                </div>
              ) : null}
            </dl>

            <p className="text-xs leading-relaxed text-muted-foreground">{t("terms")}</p>

            {payload.customer_signature_url && payload.customer_verified ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("existingSignature")}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payload.customer_signature_url}
                  alt={t("signatureLabel")}
                  className="mx-auto max-h-24 rounded border bg-white p-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useExisting}
                    onChange={(e) => setUseExisting(e.target.checked)}
                  />
                  {t("useExistingSignature")}
                </label>
              </div>
            ) : null}

            {!useExisting && (
              <div ref={canvasContainerRef}>
                <p className="mb-2 text-sm font-medium">{t("signatureLabel")}</p>
                <SignatureCanvas clearLabel={t("clearSignature")} onChange={setHasSignature} />
              </div>
            )}

            {!showReject ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={submitting || (!useExisting && !hasSignature)}
                  onClick={() => void handleApprove()}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("approve")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReject(true)}
                >
                  {t("reject")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder={t("rejectReasonPlaceholder")}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={rejecting}
                    onClick={() => void handleReject()}
                  >
                    {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmReject")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowReject(false)}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
