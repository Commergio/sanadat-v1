"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { SupportPriorityBadge, SupportStatusBadge } from "@/components/support/support-badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addTenantSupportNote,
  useTenantSupportTicket,
} from "@/hooks/use-support";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type { PlatformApiError } from "@/lib/platform/api-client";

export function TenantSupportDetailContent({ ticketId }: { ticketId: string }) {
  const t = useTranslations("dashboard.support");
  const locale = useLocale();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const { detail, loading, error, refresh } = useTenantSupportTicket(ticketId);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await addTenantSupportNote(ticketId, reply.trim());
      setReply("");
      toast.success(t("replySent"));
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("replyFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !detail) {
    return (
      <div className="dashboard-card p-8 text-center text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/support" className="text-sm text-primary hover:underline">
          {t("backToList")}
        </Link>
        <div className="dashboard-card border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error.message ?? t("loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/support" className="text-sm text-primary hover:underline">
          {t("backToList")}
        </Link>
        <div className="dashboard-card p-8 text-center">
          <p className="font-medium">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  const { ticket, notes } = detail;
  const closed = ticket.status === "closed";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/support" className="text-sm text-primary hover:underline">
        {t("backToList")}
      </Link>

      <div className="dashboard-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{ticket.subject}</h2>
          <div className="flex flex-wrap gap-2">
            <SupportStatusBadge status={ticket.status} />
            <SupportPriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
        <p className="text-xs text-muted-foreground">
          {t("opened")} {formatDate(ticket.createdAt, locale)}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t("conversation")}</h3>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noReplies")}</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="dashboard-card p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {note.authorEmail ?? t("unknownAuthor")} · {formatDate(note.createdAt, locale)}
                </p>
                <p className="text-sm whitespace-pre-wrap">{note.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!closed && (
        <div className="dashboard-card p-4 space-y-3">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("replyPlaceholder")}
            rows={4}
          />
          <Button onClick={() => void handleReply()} disabled={busy || !reply.trim()}>
            {t("sendReply")}
          </Button>
        </div>
      )}

      {closed && (
        <p className="text-sm text-muted-foreground">{t("closedHint")}</p>
      )}
    </div>
  );
}
