"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { SupportPriorityBadge, SupportStatusBadge } from "@/components/support/support-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTenantSupportTicket,
  useTenantSupportTickets,
} from "@/hooks/use-support";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type { PlatformApiError } from "@/lib/platform/api-client";
import type { SupportTicketPriority } from "@/application/support/types";

export function TenantSupportContent() {
  const t = useTranslations("dashboard.support");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriority>("normal");
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refresh } = useTenantSupportTickets({ page, limit: 20 });

  useEffect(() => {
    if (error) {
      toast.error(error.message ?? t("loadFailed"));
    }
  }, [error, t]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.limit ?? 20)));

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setPriority("normal");
  };

  const handleCreate = async () => {
    if (subject.trim().length < 3 || description.trim().length < 10) {
      toast.error(t("validationHint"));
      return;
    }
    setBusy(true);
    try {
      await createTenantSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      toast.success(t("created"));
      setCreateOpen(false);
      resetForm();
      setPage(1);
      await refresh();
    } catch (err) {
      const e = err as PlatformApiError;
      toast.error(e.message ?? t("createFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("newTicket")}
        </Button>
      </div>

      {loading && !data ? (
        <div className="dashboard-card p-8 text-center text-sm text-muted-foreground">
          {t("loading")}
        </div>
      ) : error && !data ? (
        <div className="dashboard-card border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error.message ?? t("loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            {t("retry")}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="dashboard-card flex flex-col items-center gap-3 p-10 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold">{t("emptyTitle")}</h3>
          <p className="max-w-sm text-sm text-muted-foreground">{t("emptyDesc")}</p>
          <Button onClick={() => setCreateOpen(true)}>{t("newTicket")}</Button>
        </div>
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="divide-y divide-border">
            {items.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("updated")} {formatDate(ticket.updatedAt, locale)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <SupportStatusBadge status={ticket.status} />
                  <SupportPriorityBadge priority={ticket.priority} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("prev")}
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t("subject")}</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("subjectPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">{t("priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as SupportTicketPriority)}>
                <SelectTrigger id="priority">
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
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={() => void handleCreate()} disabled={busy}>
                {t("submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
