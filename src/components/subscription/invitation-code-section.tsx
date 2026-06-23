"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Gift, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import {
  applyInvitationCode,
  PENDING_INVITATION_CODE_KEY,
} from "@/hooks/use-invitation-codes";
import type { PlatformApiError } from "@/lib/platform/api-client";

interface InvitationCodeSectionProps {
  canManage: boolean;
  onApplied: () => Promise<void>;
}

export function InvitationCodeSection({ canManage, onApplied }: InvitationCodeSectionProps) {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successExpiresAt, setSuccessExpiresAt] = useState<string | null>(null);
  const [showPendingHint, setShowPendingHint] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("invitation_code")?.trim();
    const fromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem(PENDING_INVITATION_CODE_KEY)?.trim()
        : null;
    const pending = fromUrl || fromStorage || "";
    if (pending) {
      setCode(pending.toUpperCase());
      setShowPendingHint(true);
    }
  }, [searchParams]);

  const handleApply = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error(t("invitationCodeRequired"));
      return;
    }

    setSubmitting(true);
    setSuccessExpiresAt(null);
    try {
      const result = await applyInvitationCode(trimmed);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PENDING_INVITATION_CODE_KEY);
      }
      setSuccessExpiresAt(result.expiresAt);
      setShowPendingHint(false);
      toast.success(
        t("invitationCodeSuccess", {
          expiresAt: formatDate(result.expiresAt, locale),
        })
      );
      await onApplied();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("invitationCodeFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [code, locale, onApplied, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5 text-primary" />
          {t("invitationCodeTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPendingHint && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {t("invitationCodePendingHint")}
          </p>
        )}

        {successExpiresAt && (
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              {t("invitationCodeSuccess", {
                expiresAt: formatDate(successExpiresAt, locale),
              })}
            </p>
          </div>
        )}

        {!canManage && (
          <p className="text-sm text-muted-foreground">{t("readOnlyHint")}</p>
        )}

        {canManage && (
          <>
            <p className="text-sm text-muted-foreground">{t("invitationCodeHint")}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <label htmlFor="invitation-code" className="text-sm font-medium">
                  {t("invitationCodeLabel")}
                </label>
                <Input
                  id="invitation-code"
                  dir="ltr"
                  className="font-mono uppercase"
                  value={code}
                  disabled={submitting}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t("invitationCodePlaceholder")}
                />
              </div>
              <Button
                type="button"
                disabled={submitting || !code.trim()}
                onClick={() => void handleApply()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("invitationCodeApplying")}
                  </>
                ) : (
                  t("invitationCodeApply")
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
