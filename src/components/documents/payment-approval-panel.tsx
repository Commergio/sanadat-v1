"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentLifecycleStatus, PaymentVoucher } from "@/lib/types";
import { effectivePaymentLifecycle } from "@/lib/documents/payment-lifecycle";
import { formatDate } from "@/lib/format";
import { ReceiptLifecycleBadge } from "@/components/documents/receipt-approval-panel";

interface PaymentApprovalPanelProps {
  payment: PaymentVoucher;
  canSendApproval: boolean;
}

function exportEnabledHint(lifecycle: DocumentLifecycleStatus): boolean {
  return lifecycle === "draft" || lifecycle === "pending_approval" || lifecycle === "rejected";
}

export function PaymentApprovalPanel({ payment, canSendApproval }: PaymentApprovalPanelProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("paymentApproval");
  const [sending, setSending] = useState(false);
  const lifecycle = effectivePaymentLifecycle(payment.lifecycle_status);

  const handleSendApproval = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/payment-vouchers/${payment.id}/send-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? t("sendFailed"));
        return;
      }
      toast.success(
        lifecycle === "pending_approval" ? t("resendSuccess") : t("sendSuccess")
      );
      if (data.whatsAppUrl) {
        window.open(data.whatsAppUrl, "_blank");
      }
      router.refresh();
    } catch {
      toast.error(t("sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const showSendButton =
    canSendApproval && (lifecycle === "draft" || lifecycle === "pending_approval");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t("panelTitle")}</CardTitle>
          <ReceiptLifecycleBadge lifecycle={lifecycle} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {exportEnabledHint(lifecycle) ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-900 dark:text-amber-200">
            {t("exportBlockedHint")}
          </p>
        ) : null}

        {lifecycle === "draft" && (
          <p className="text-muted-foreground">{t("draftHint")}</p>
        )}

        {lifecycle === "pending_approval" && (
          <div className="space-y-1 text-muted-foreground">
            <p>{t("pendingHint")}</p>
            {payment.approval_sent_at ? (
              <p>{t("sentAt", { date: formatDate(payment.approval_sent_at, locale) })}</p>
            ) : null}
            {payment.approval_expires_at ? (
              <p>{t("expiresAt", { date: formatDate(payment.approval_expires_at, locale) })}</p>
            ) : null}
          </div>
        )}

        {showSendButton ? (
          <Button
            type="button"
            className="gap-2"
            onClick={handleSendApproval}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {lifecycle === "pending_approval" ? t("resendForApproval") : t("sendForApproval")}
          </Button>
        ) : null}

        {lifecycle === "rejected" && payment.rejection_reason ? (
          <p className="text-destructive">
            {t("rejectionReason", { reason: payment.rejection_reason })}
          </p>
        ) : null}

        {lifecycle === "issued" && payment.approved_at ? (
          <div className="space-y-1 text-muted-foreground">
            <p>{t("approvedAt", { date: formatDate(payment.approved_at, locale) })}</p>
            {payment.approved_by_name ? (
              <p>{t("approvedBy", { name: payment.approved_by_name })}</p>
            ) : null}
            {payment.display_number ? (
              <p className="font-medium text-foreground">
                {t("officialNumber", { number: payment.display_number })}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
