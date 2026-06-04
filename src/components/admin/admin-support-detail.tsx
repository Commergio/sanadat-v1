"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminErrorBanner } from "@/components/admin/admin-error-banner";
import { AdminTableSkeleton } from "@/components/admin/admin-loading";
import { SupportPriorityBadge, SupportStatusBadge } from "@/components/support/support-badges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPlatformSupportNote,
  updatePlatformSupportTicket,
  usePlatformSupportTicket,
} from "@/hooks/use-support";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type { PlatformApiError } from "@/lib/platform/api-client";
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/application/support/types";

export function AdminSupportDetailContent({ ticketId }: { ticketId: string }) {
  const t = useTranslations("admin.support");
  const locale = useLocale();
  const { detail, loading, error, refresh } = usePlatformSupportTicket(ticketId);

  const [status, setStatus] = useState<SupportTicketStatus>("open");
  const [priority, setPriority] = useState<SupportTicketPriority>("normal");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publicReply, setPublicReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);
      } catch {
        setCurrentUserId(null);
      }
    }
    void loadUser();
  }, []);

  useEffect(() => {
    if (detail?.ticket) {
      setStatus(detail.ticket.status);
      setPriority(detail.ticket.priority);
      setAssignedTo(detail.ticket.assignedTo);
    }
  }, [detail?.ticket]);

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await updatePlatformSupportTicket(ticketId, {
        status,
        priority,
        assigned_to: assignedTo,
      });
      toast.success(t("updated"));
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (body: string, internal: boolean) => {
    if (!body.trim()) return;
    setNoteBusy(true);
    try {
      await addPlatformSupportNote(ticketId, {
        body: body.trim(),
        internal_only: internal,
      });
      toast.success(t("noteAdded"));
      if (internal) setInternalNote("");
      else setPublicReply("");
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("noteFailed"));
    } finally {
      setNoteBusy(false);
    }
  };

  if (loading && !detail) return <AdminTableSkeleton rows={4} />;

  if (error && !detail) {
    return (
      <div className="space-y-4">
        <Link href="/admin/support" className="text-sm text-primary hover:underline">
          {t("backToList")}
        </Link>
        <AdminErrorBanner error={error} onRetry={() => void refresh()} retryLabel={t("retry")} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link href="/admin/support" className="text-sm text-primary hover:underline">
          {t("backToList")}
        </Link>
        <div className="dashboard-card p-8 text-center">
          <p className="font-medium">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  const { ticket, notes } = detail;

  return (
    <div className="space-y-6">
      <Link href="/admin/support" className="text-sm text-primary hover:underline">
        {t("backToList")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="dashboard-card p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">{ticket.subject}</h2>
              <div className="flex gap-2">
                <SupportStatusBadge status={ticket.status} />
                <SupportPriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {ticket.companyName} · {ticket.createdByEmail}
            </p>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            <p className="text-xs text-muted-foreground">
              {t("opened")} {formatDate(ticket.createdAt, locale)}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("conversation")}</h3>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noNotes")}</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className={`dashboard-card p-4 ${note.internalOnly ? "border-amber-500/30 bg-amber-500/5" : ""}`}
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      {note.authorEmail ?? "—"}
                      {note.internalOnly ? ` · ${t("internalBadge")}` : ""} ·{" "}
                      {formatDate(note.createdAt, locale)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-card p-4 space-y-3">
            <Label>{t("publicReply")}</Label>
            <Textarea
              value={publicReply}
              onChange={(e) => setPublicReply(e.target.value)}
              placeholder={t("publicReplyPlaceholder")}
              rows={3}
            />
            <Button
              size="sm"
              disabled={noteBusy || !publicReply.trim()}
              onClick={() => void handleAddNote(publicReply, false)}
            >
              {t("sendPublicReply")}
            </Button>
          </div>

          <div className="dashboard-card p-4 space-y-3 border-dashed">
            <Label>{t("internalNote")}</Label>
            <Textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder={t("internalNotePlaceholder")}
              rows={3}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={noteBusy || !internalNote.trim()}
              onClick={() => void handleAddNote(internalNote, true)}
            >
              {t("addInternalNote")}
            </Button>
          </div>
        </div>

        <aside className="dashboard-card p-5 space-y-4 h-fit">
          <h3 className="font-semibold text-sm">{t("manageTitle")}</h3>
          <div className="space-y-2">
            <Label>{t("statusLabel")}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SupportTicketStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{t("status_open")}</SelectItem>
                <SelectItem value="in_progress">{t("status_in_progress")}</SelectItem>
                <SelectItem value="resolved">{t("status_resolved")}</SelectItem>
                <SelectItem value="closed">{t("status_closed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("priorityLabel")}</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as SupportTicketPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("priority_low")}</SelectItem>
                <SelectItem value="normal">{t("priority_normal")}</SelectItem>
                <SelectItem value="high">{t("priority_high")}</SelectItem>
                <SelectItem value="urgent">{t("priority_urgent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("assigneeLabel")}</Label>
            <Select
              value={
                !assignedTo
                  ? "unassigned"
                  : assignedTo === currentUserId
                    ? "me"
                    : "unassigned"
              }
              onValueChange={(v) =>
                setAssignedTo(v === "unassigned" ? null : v === "me" ? currentUserId : null)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{t("unassigned")}</SelectItem>
                {currentUserId && (
                  <SelectItem value="me">{t("assignToMe")}</SelectItem>
                )}
              </SelectContent>
            </Select>
            {ticket.assignedToEmail && (
              <p className="text-xs text-muted-foreground">
                {t("currentAssignee")}: {ticket.assignedToEmail}
              </p>
            )}
          </div>
          <Button className="w-full" onClick={() => void handleSaveMeta()} disabled={saving}>
            {t("saveChanges")}
          </Button>
        </aside>
      </div>
    </div>
  );
}
