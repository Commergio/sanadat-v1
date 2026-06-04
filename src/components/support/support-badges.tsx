"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/application/support/types";

const statusStyles: Record<SupportTicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  closed: "bg-muted text-muted-foreground",
};

const priorityStyles: Record<SupportTicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-300",
};

export function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  const t = useTranslations("support.status");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
        statusStyles[status]
      )}
    >
      {t(status)}
    </span>
  );
}

export function SupportPriorityBadge({ priority }: { priority: SupportTicketPriority }) {
  const t = useTranslations("support.priority");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
        priorityStyles[priority]
      )}
    >
      {t(priority)}
    </span>
  );
}
