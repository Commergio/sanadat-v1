"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Building2, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { mapBillingError } from "@/lib/billing/client";
import type { ManualPaymentRequestApi } from "@/hooks/use-billing";

interface ManualBankTransferSectionProps {
  canManage: boolean;
  pendingRequest: ManualPaymentRequestApi | null;
  onSubmitted: () => Promise<void>;
}

export function ManualBankTransferSection({
  canManage,
  pendingRequest,
  onSubmitted,
}: ManualBankTransferSectionProps) {
  const t = useTranslations("subscription");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const showPending = Boolean(pendingRequest) || submitted;

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError(t("manualTransferFileRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("proof", file);
      form.append("plan_code", "sanadat_annual");
      form.append("billing_cycle", "yearly");
      form.append("amount", String(SUBSCRIPTION_PRICE));
      form.append("currency", "SAR");

      const res = await fetch("/api/billing/manual-payment", {
        method: "POST",
        body: form,
      });
      const payload = await res.json();
      if (!res.ok) {
        const err = mapBillingError(payload, t("manualTransferSubmitFailed"));
        if (err.code === "CONFLICT") {
          const message = t("manualTransferPendingExists");
          setError(message);
          toast.message(message);
          return;
        }
        setError(err.message);
        return;
      }

      setSubmitted(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(t("manualTransferSubmittedToast"));
      await onSubmitted();
    } catch {
      setError(t("manualTransferSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [file, onSubmitted, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          {t("manualTransferTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t("manualTransferInstructionsTitle")}</p>
          <p className="mt-2 whitespace-pre-line">{t("manualTransferInstructions")}</p>
        </div>

        {showPending && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/40">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {t("manualTransferPendingTitle")}
            </p>
            <p className="mt-1 text-amber-700/90 dark:text-amber-400">
              {t("manualTransferPendingMessage")}
            </p>
          </div>
        )}

        {!canManage && (
          <p className="text-sm text-muted-foreground">{t("readOnlyHint")}</p>
        )}

        {canManage && !showPending && (
          <>
            <div className="space-y-2">
              <label htmlFor="manual-transfer-proof" className="text-sm font-medium">
                {t("manualTransferProofLabel")}
              </label>
              <input
                ref={fileInputRef}
                id="manual-transfer-proof"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                disabled={submitting}
                className="block w-full text-sm text-muted-foreground file:me-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
              <p className="text-xs text-muted-foreground">{t("manualTransferFileHint")}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="button"
              variant="secondary"
              disabled={submitting || !file}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("manualTransferSubmitting")}
                </>
              ) : (
                <>
                  <Upload className="me-2 h-4 w-4" />
                  {t("manualTransferSubmit")}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
