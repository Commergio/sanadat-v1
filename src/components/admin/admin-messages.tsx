"use client";

import { useTranslations } from "next-intl";
import { MessageSquare, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminCardsSkeleton } from "@/components/admin/admin-loading";
import { useAdminLoading } from "@/components/admin/use-admin-loading";
import { adminMessageTemplates } from "@/lib/mock-admin-data";
import { cn } from "@/lib/utils";

const categoryStyles = {
  renewal: "bg-amber-500/10 text-amber-700",
  activation: "bg-emerald-500/10 text-emerald-700",
  maintenance: "bg-blue-500/10 text-blue-700",
  update: "bg-violet-500/10 text-violet-700",
};

export function AdminMessagesContent() {
  const t = useTranslations("admin");
  const loading = useAdminLoading();

  if (loading) return <AdminCardsSkeleton count={4} />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {adminMessageTemplates.map((tpl) => (
        <div key={tpl.id} className="dashboard-card flex flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-border/80 px-5 py-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  categoryStyles[tpl.category]
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t(tpl.nameKey)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t(`category_${tpl.category}`)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-5 py-4">
            <p className="flex-1 rounded-lg bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {t(tpl.bodyKey)}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info(t("editDemo"))}>
                <Pencil className="h-3.5 w-3.5" />
                {t("edit")}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => toast.success(t("sendDemo", { name: t(tpl.nameKey) }))}
              >
                <Send className="h-3.5 w-3.5" />
                {t("sendTest")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
