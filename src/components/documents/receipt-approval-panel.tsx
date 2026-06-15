"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentLifecycleStatus, ReceiptVoucher } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface ReceiptApprovalPanelProps {
  receipt: ReceiptVoucher;
  canSendApproval: boolean;
}

function lifecycleVariant(status: DocumentLifecycleStatus | undefined) {
  switch (status) {
    case "draft":
      return "secondary" as const;
    case "pending_approval":
      return "warning" as const;
    case "issued":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "success" as const;
  }
}

export function ReceiptApprovalPanel({ receipt, canSendApproval }: ReceiptApprovalPanelProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("receiptApproval");
  const [sending, setSending] = useState(false);
  const lifecycle = receipt.lifecycle_status ?? "issued";

  const handleSendApproval = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}/send-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? t("sendFailed"));
        return;
      }
      toast.success(t("sendSuccess"));
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t("panelTitle")}</CardTitle>
          <Badge variant={lifecycleVariant(lifecycle)}>{t(`lifecycle.${lifecycle}`)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {lifecycle === "draft" && (
          <>
            <p className="text-muted-foreground">{t("draftHint")}</p>
            {canSendApproval ? (
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
                {t("sendForApproval")}
              </Button>
            ) : null}
          </>
        )}

        {lifecycle === "pending_approval" && (
          <div className="space-y-1 text-muted-foreground">
            <p>{t("pendingHint")}</p>
            {receipt.approval_sent_at ? (
              <p>{t("sentAt", { date: formatDate(receipt.approval_sent_at, locale) })}</p>
            ) : null}
            {receipt.approval_expires_at ? (
              <p>{t("expiresAt", { date: formatDate(receipt.approval_expires_at, locale) })}</p>
            ) : null}
          </div>
        )}

        {lifecycle === "rejected" && receipt.rejection_reason ? (
          <p className="text-destructive">
            {t("rejectionReason", { reason: receipt.rejection_reason })}
          </p>
        ) : null}

        {lifecycle === "issued" && receipt.approved_at ? (
          <div className="space-y-1 text-muted-foreground">
            <p>{t("approvedAt", { date: formatDate(receipt.approved_at, locale) })}</p>
            {receipt.approved_by_name ? (
              <p>{t("approvedBy", { name: receipt.approved_by_name })}</p>
            ) : null}
            {receipt.display_number ? (
              <p className="font-medium text-foreground">
                {t("officialNumber", { number: receipt.display_number })}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ReceiptLifecycleBadge({ lifecycle }: { lifecycle?: DocumentLifecycleStatus }) {
  const t = useTranslations("receiptApproval");
  const status = lifecycle ?? "issued";
  return <Badge variant={lifecycleVariant(status)}>{t(`lifecycle.${status}`)}</Badge>;
}
